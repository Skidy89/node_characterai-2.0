import Parser from "./parser.js";
import { PrivateProfile } from "./profile/privateProfile.js";
import Requester from "./requester.js";
import { CAIWebsocket, CAIWebsocketConnectionType, } from "./websocket.js";
import DMConversation from "./chat/dmConversation.js";
import { Character } from "./character/character.js";
import { v4 as uuidv4 } from "uuid";
const fallbackEdgeRollout = "60";
export var CheckAndThrow;
(function (CheckAndThrow) {
    CheckAndThrow[CheckAndThrow["RequiresAuthentication"] = 0] = "RequiresAuthentication";
    CheckAndThrow[CheckAndThrow["RequiresNoAuthentication"] = 1] = "RequiresNoAuthentication";
})(CheckAndThrow || (CheckAndThrow = {}));
export class CharacterAI {
    token = "";
    get authenticated() {
        return this.token != "";
    }
    myProfile;
    requester;
    automaticallyReconnectWebsockets = true;
    conversations = new Map();
    maxConversationsCache = 50; // Limit to prevent unbounded growth
    markChatAsActive(conversation) {
        this.conversations.set(conversation.chatId, conversation);
        // Clean up old conversations if limit exceeded
        if (this.conversations.size > this.maxConversationsCache) {
            const firstKey = this.conversations.keys().next().value;
            if (firstKey)
                this.conversations.delete(firstKey);
        }
    }
    async resurrectActiveConversations() {
        const promises = Array.from(this.conversations.values()).map((conversation) => conversation.refreshMessages());
        await Promise.all(promises);
    }
    dmChatWebsocket = null;
    async sendDMWebsocketAsync(options, conversation) {
        if (conversation)
            this.markChatAsActive(conversation);
        return await this.dmChatWebsocket?.sendAsync(options);
    }
    async sendDMWebsocketCommandAsync(options, conversation) {
        const requestId = uuidv4();
        return await this.sendDMWebsocketAsync({
            parseJSON: true,
            expectedReturnCommand: options.expectedReturnCommand,
            messageType: CAIWebsocketConnectionType.DM,
            waitForAIResponse: options.waitForAIResponse ?? true,
            expectedRequestId: requestId,
            streaming: options.streaming,
            fireAndForget: options.fireAndForget ?? false,
            data: Parser.stringify({
                command: options.command,
                origin_id: options.originId,
                payload: options.payload,
                request_id: requestId,
            }),
        }, conversation);
    }
    groupChatWebsocket = null;
    async sendGroupChatWebsocketAsync(options) {
        return await this.groupChatWebsocket?.sendAsync(options);
    }
    async sendGroupChatWebsocketCommandAsync(options, conversation) {
        const requestId = uuidv4();
        if (conversation)
            this.markChatAsActive(conversation);
        return await this.sendGroupChatWebsocketAsync({
            parseJSON: true,
            expectedReturnCommand: options.expectedReturnCommand,
            messageType: CAIWebsocketConnectionType.GroupChat,
            waitForAIResponse: true,
            expectedRequestId: requestId,
            streaming: options.streaming,
            fireAndForget: options.fireAndForget ?? false,
            data: Parser.stringify({
                command: options.command,
                origin_id: options.originId,
                payload: options.payload,
                request_id: requestId,
            }),
        });
    }
    async openWebsockets() {
        try {
            // Close existing websockets first to prevent memory leaks
            this.closeWebsockets();
            const request = await this.requester.request("https://character.ai/", {
                method: "GET",
                includeAuthorization: false,
            });
            const { headers } = request;
            let cookies = headers.get("set-cookie");
            let edgeRollout = cookies?.match(/edge_rollout=([^;]+)/)?.[1] ??
                cookies?.match(/deployment-target=([^;]+)/)?.[1] ??
                fallbackEdgeRollout;
            if (!edgeRollout) {
                if (!request.ok)
                    throw Error("Could not get edge rollout");
                edgeRollout = fallbackEdgeRollout;
            }
            edgeRollout = edgeRollout;
            this.groupChatWebsocket = await new CAIWebsocket({
                url: "wss://neo.character.ai/connection/websocket",
                authorization: this.token,
                edgeRollout,
                userId: this.myProfile.userId,
            }).open(true);
            this.dmChatWebsocket = await new CAIWebsocket({
                url: "wss://neo.character.ai/ws/",
                authorization: this.token,
                edgeRollout,
                userId: this.myProfile.userId,
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
        }
        catch (error) {
            throw Error("Failed opening websocket." + error);
        }
    }
    closeWebsockets() {
        this.dmChatWebsocket?.close();
        this.groupChatWebsocket?.close();
    }
    async fetchCharacter(characterId) {
        this.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.requester.request("https://neo.character.ai/character/v1/get_character_info", {
            method: "POST",
            body: Parser.stringify({ external_id: characterId, lang: "en" }),
            includeAuthorization: true,
            contentType: "application/json",
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error("Failed to fetch character");
        return new Character(this, response.character);
    }
    async fetchCharacterByChatId(chat_id) {
        this.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.requester.request(`https://neo.character.ai/chat/${chat_id}/?load_metadata=true`, {
            method: "GET",
            includeAuthorization: true,
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error("Failed to fetch character");
        return response;
    }
    async fetchLatestDMConversationWith(characterId) {
        this.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.requester.request(`https://neo.character.ai/chats/recent/${characterId}`, {
            method: "GET",
            includeAuthorization: true,
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(response);
        if (!response.chats || response.chats.length === 0) {
            const ourChat = uuidv4();
            await this.sendDMWebsocketCommandAsync({
                command: "create_chat",
                originId: "Android",
                streaming: true,
                fireAndForget: true,
                expectedReturnCommand: "create_chat_response",
                payload: {
                    chat_type: "TYPE_ONE_ON_ONE",
                    chat: {
                        chat_id: ourChat,
                        creator_id: this.myProfile.userId.toString(),
                        character_id: characterId,
                        type: "TYPE_ONE_ON_ONE",
                        visibility: "VISIBILITY_PRIVATE",
                    },
                    with_greeting: false,
                    with_pre_generated_history: false,
                },
            });
            const response = await this.fetchCharacterByChatId(ourChat);
            const chatObject = response.chat;
            const conversation = new DMConversation(this, chatObject);
            await conversation.refreshMessages();
            return conversation;
        }
        const chatObject = response.chats[0];
        const conversation = new DMConversation(this, chatObject);
        await conversation.refreshMessages();
        return conversation;
    }
    async authenticate(sessionToken) {
        this.checkAndThrow(CheckAndThrow.RequiresNoAuthentication);
        if (sessionToken.startsWith("Token "))
            sessionToken = sessionToken.substring("Token ".length, sessionToken.length);
        this.requester.updateToken(sessionToken);
        const request = await this.requester.request("https://plus.character.ai/chat/user/settings/", {
            method: "GET",
            includeAuthorization: true,
        });
        if (!request.ok)
            throw Error("Invaild authentication token.");
        this.token = sessionToken;
        await this.myProfile.refreshProfile();
        await this.openWebsockets();
    }
    unauthenticate() {
        this.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        this.closeWebsockets();
        this.conversations.clear();
        this.token = "";
    }
    checkAndThrow(argument, requiresAuthenticatedMessage = "You must be authenticated to do this.") {
        if (argument == CheckAndThrow.RequiresAuthentication && !this.authenticated)
            throw Error(requiresAuthenticatedMessage);
        if (argument == CheckAndThrow.RequiresNoAuthentication &&
            this.authenticated)
            throw Error("Already authenticated");
    }
    constructor() {
        this.myProfile = new PrivateProfile(this);
        this.requester = new Requester();
    }
}
//# sourceMappingURL=client.js.map