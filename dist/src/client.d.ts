import { PrivateProfile } from "./profile/privateProfile.js";
import Requester from "./requester.js";
import { ICAIWebsocketCommand, ICAIWebsocketMessage } from "./websocket.js";
import DMConversation from "./chat/dmConversation.js";
import { Character } from "./character/character.js";
import { Conversation } from "./chat/conversation.js";
export declare enum CheckAndThrow {
    RequiresAuthentication = 0,
    RequiresNoAuthentication = 1
}
export declare class CharacterAI {
    private token;
    get authenticated(): boolean;
    myProfile: PrivateProfile;
    requester: Requester;
    automaticallyReconnectWebsockets: boolean;
    private conversations;
    private maxConversationsCache;
    markChatAsActive(conversation: Conversation): void;
    private resurrectActiveConversations;
    private dmChatWebsocket;
    sendDMWebsocketAsync(options: ICAIWebsocketMessage, conversation?: Conversation): Promise<unknown>;
    sendDMWebsocketCommandAsync(options: ICAIWebsocketCommand, conversation?: Conversation): Promise<unknown>;
    private groupChatWebsocket;
    sendGroupChatWebsocketAsync(options: ICAIWebsocketMessage): Promise<unknown>;
    sendGroupChatWebsocketCommandAsync(options: ICAIWebsocketCommand, conversation?: Conversation): Promise<unknown>;
    private openWebsockets;
    private closeWebsockets;
    fetchCharacter(characterId: string): Promise<Character>;
    private fetchCharacterByChatId;
    fetchLatestDMConversationWith(characterId: string): Promise<DMConversation>;
    authenticate(sessionToken: string): Promise<void>;
    unauthenticate(): void;
    checkAndThrow(argument: CheckAndThrow, requiresAuthenticatedMessage?: string): void;
    constructor();
}
//# sourceMappingURL=client.d.ts.map