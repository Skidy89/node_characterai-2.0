import Parser from './parser';
import { PrivateProfile } from './profile/privateProfile';
import Requester from './requester';
import { CAIWebsocket, CAIWebsocketConnectionType, ICAIWebsocketCommand, ICAIWebsocketMessage } from './websocket';
import DMConversation from './chat/dmConversation';
import { Character } from './character/character';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from './chat/conversation';

const fallbackEdgeRollout = '60';

export enum CheckAndThrow {
    RequiresAuthentication = 0,
    RequiresNoAuthentication
}

export class CharacterAI {
    private token: string = "";
    public get authenticated() { return this.token != ""; }
    
    public myProfile: PrivateProfile;
    public requester: Requester;

    public automaticallyReconnectWebsockets: boolean = true;
    private conversations: Map<string, Conversation> = new Map();
    
    public markChatAsActive(conversation: Conversation) {
        this.conversations.set(conversation.chatId, conversation);
    }
    
    private async resurrectActiveConversations() {
        const promises = Array.from(this.conversations.values()).map(conversation => 
            conversation.refreshMessages()
        );
        await Promise.all(promises);
    }

    private dmChatWebsocket: CAIWebsocket | null = null;
    async sendDMWebsocketAsync(options: ICAIWebsocketMessage, conversation?: Conversation) { 
        if (conversation) this.markChatAsActive(conversation);
        return await this.dmChatWebsocket?.sendAsync(options); 
    }
    
    async sendDMWebsocketCommandAsync(options: ICAIWebsocketCommand, conversation?: Conversation) {
        const requestId = uuidv4();
        return await this.sendDMWebsocketAsync({
            parseJSON: true,
            expectedReturnCommand: options.expectedReturnCommand,
            messageType: CAIWebsocketConnectionType.DM,
            waitForAIResponse: options.waitForAIResponse ?? true,
            expectedRequestId: requestId,
            streaming: options.streaming,
            data: Parser.stringify({
                command: options.command,
                origin_id: options.originId,
                payload: options.payload,
                request_id: requestId
            })
        }, conversation);
    }

    private groupChatWebsocket: CAIWebsocket | null = null;
    async sendGroupChatWebsocketAsync(options: ICAIWebsocketMessage) { 
        return await this.groupChatWebsocket?.sendAsync(options); 
    }
    
    async sendGroupChatWebsocketCommandAsync(options: ICAIWebsocketCommand, conversation?: Conversation) {
        const requestId = uuidv4();
        if (conversation) this.markChatAsActive(conversation);

        return await this.sendGroupChatWebsocketAsync({
            parseJSON: true,
            expectedReturnCommand: options.expectedReturnCommand,
            messageType: CAIWebsocketConnectionType.GroupChat,
            waitForAIResponse: true,
            expectedRequestId: requestId,
            streaming: options.streaming,
            data: Parser.stringify({
                command: options.command,
                origin_id: options.originId,
                payload: options.payload,
                request_id: requestId
            })
        });
    }

    private async openWebsockets() {
        try {
            const request = await this.requester.request("https://character.ai/", {
                method: "GET",
                includeAuthorization: false
            });
            const { headers } = request;

            let edgeRollout = headers.get("set-cookie")?.match(/edge_rollout=([^;]+)/)?.[1];
            if (!edgeRollout) {
                if (!request.ok) throw Error("Could not get edge rollout");
                edgeRollout = fallbackEdgeRollout;
            }

            edgeRollout = edgeRollout as string;
            this.groupChatWebsocket = await new CAIWebsocket({
                url: "wss://neo.character.ai/connection/websocket",
                authorization: this.token,
                edgeRollout,
                userId: this.myProfile.userId
            }).open(true);

            this.dmChatWebsocket = await new CAIWebsocket({
                url: "wss://neo.character.ai/ws/",
                authorization: this.token,
                edgeRollout,
                userId: this.myProfile.userId
            }).open(false);

            this.dmChatWebsocket.on("disconnected", async () => {
                if (this.automaticallyReconnectWebsockets)
                    await this.openWebsockets();
            });
            this.groupChatWebsocket.on("disconnected", async () => {
                if (this.automaticallyReconnectWebsockets)
                    await this.openWebsockets();
            });

            this.dmChatWebsocket.once("connected", () => this.resurrectActiveConversations());
            this.groupChatWebsocket.once("connected", () => this.resurrectActiveConversations());
        } catch (error) {
            throw Error("Failed opening websocket." + error);
        }
    }
    
    private closeWebsockets() {
        this.dmChatWebsocket?.close();
        this.groupChatWebsocket?.close();
    }

    async fetchCharacter(characterId: string) {
        this.checkAndThrow(CheckAndThrow.RequiresAuthentication);

        const request = await this.requester.request("https://neo.character.ai/character/v1/get_character_info", {
            method: 'POST',
            body: Parser.stringify({ external_id: characterId, lang: "en" }),
            includeAuthorization: true,
            contentType: 'application/json'
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok) throw new Error("Failed to fetch character");

        return new Character(this, response.character);
    }

    async fetchLatestDMConversationWith(characterId: string) {
        this.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        
        const request = await this.requester.request(`https://neo.character.ai/chats/recent/${characterId}`, {
            method: 'GET',
            includeAuthorization: true
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok) throw new Error(response);

        const chatObject = response.chats[0];
        
        const conversation = new DMConversation(this, chatObject);
        await conversation.refreshMessages();

        return conversation;
    }

    async authenticate(sessionToken: string) {
        this.checkAndThrow(CheckAndThrow.RequiresNoAuthentication);
        
        if (sessionToken.startsWith("Token "))
            sessionToken = sessionToken.substring("Token ".length, sessionToken.length);

        this.requester.updateToken(sessionToken);

        const request = await this.requester.request("https://plus.character.ai/chat/user/settings/", {
            method: "GET",
            includeAuthorization: true
        });
        if (!request.ok) throw Error("Invaild authentication token.");

        this.token = sessionToken;

        await this.myProfile.refreshProfile();
        await this.openWebsockets();
    }

    unauthenticate() {
        this.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        this.closeWebsockets();
        this.token = "";
    }

    checkAndThrow(
        argument: CheckAndThrow,
        requiresAuthenticatedMessage: string = "You must be authenticated to do this."
    ) {
        if (argument == CheckAndThrow.RequiresAuthentication && !this.authenticated)
            throw Error(requiresAuthenticatedMessage);

        if (argument == CheckAndThrow.RequiresNoAuthentication && this.authenticated) 
            throw Error("Already authenticated");
    }
    
    constructor() {
        this.myProfile = new PrivateProfile(this);
        this.requester = new Requester();
    }
}