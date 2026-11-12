var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { getterProperty, hiddenProperty, Specable } from "../utils/specable.js";
import { CheckAndThrow } from "../client.js";
import Parser from "../parser.js";
import ObjectPatcher from "../utils/patcher.js";
import Warnings from "../warnings.js";
import { CAIMessage } from "./message.js";
export var ConversationState;
(function (ConversationState) {
    ConversationState["Active"] = "STATE_ACTIVE";
    ConversationState["Archived"] = "STATE_ARCHIVED";
})(ConversationState || (ConversationState = {}));
export var ConversationVisibility;
(function (ConversationVisibility) {
    ConversationVisibility["Public"] = "VISIBILITY_PUBLIC";
    ConversationVisibility["Private"] = "VISIBILITY_PRIVATE";
})(ConversationVisibility || (ConversationVisibility = {}));
export class Conversation extends Specable {
    client;
    // max messages stored before it enters into a snake like thing to delete the oldest messages from memory.
    // must be a multiple of 50.
    maxMessagesStored = 200;
    cachedMessages = [];
    processingMessages = [];
    messageIds = [];
    get messages() {
        return { ...this.cachedMessages };
    }
    // chat_id
    chat_id = "";
    get chatId() {
        return this.chat_id;
    }
    set chatId(value) {
        this.chat_id = value;
    }
    // create_time
    create_time = "";
    get creationDate() {
        return new Date(this.create_time);
    }
    // creator_id
    creator_id = "";
    get creatorId() {
        return this.creator_id;
    }
    set creatorId(value) {
        this.creator_id = value;
    }
    // character_id
    character_id = "";
    get characterId() {
        return this.character_id;
    }
    set characterId(value) {
        this.character_id = value;
    }
    // state
    state = ConversationState.Active;
    // type
    type = "TYPE_ONE_ON_ONE";
    // visibility
    visibility = ConversationVisibility.Private;
    // features
    async getCharacter() {
        return await this.client.fetchCharacter(this.character_id);
    }
    // currently not available use creatorId instead
    async getCreator() {
        return undefined;
    }
    // preferred_model_type
    preferred_model_type = "";
    get preferredModelType() {
        return this.preferred_model_type;
    }
    set preferredModelType(value) {
        this.preferred_model_type = value;
    }
    // https://neo.character.ai/chat/${id}/preferred-model-type
    /**
     * Sets the model for this character.
     * **CAREFUL**: use `characterAI.getAvailableModels()` for the id
     */
    async setPreferredModelType(modelId) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.client.requester.request(`https://neo.character.ai/chat/${this.chatId}/preferred-model-type`, {
            method: "PATCH",
            includeAuthorization: true,
            body: Parser.stringify({ preferred_model_type: modelId }),
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(String(response));
        this.preferredModelType = modelId;
    }
    // (in cache)
    getLastMessage() {
        return this.messages.length > 0
            ? this.messages[this.messages.length - 1]
            : null;
    }
    frozen = false; // <- if refreshing, operations will be frozen
    async getTurnsBatch(nextToken, pinnedOnly) {
        let query = "";
        if (nextToken)
            query = `?next_token=${encodeURIComponent(nextToken)}`; // }
        if (pinnedOnly)
            query = "?pinned_only=true";
        // console.log(`https://neo.character.ai/turns/${this.chatId}/${query}`);
        const request = await this.client.requester.request(`https://neo.character.ai/turns/${this.chatId}/${query}`, {
            method: "GET",
            includeAuthorization: true,
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(response);
        return response;
    }
    // responsible for checking if we reached the limit to avoid too much memory usage
    addMessage(message) {
        // messages are always ranked from more recent to oldest
        if (this.processingMessages.length >= this.maxMessagesStored) {
            // remove last & show warning
            this.processingMessages.pop();
            this.processingMessages.pop();
            Warnings.show("reachedMaxMessages");
        }
        // add to front
        this.processingMessages.unshift(message);
        this.messageIds.unshift(message.turnId);
        this.cachedMessages = this.processingMessages;
        return message;
    }
    async fetchMessagesViaQuery(pinnedOnly, maxMessages = this.maxMessagesStored) {
        const { maxMessagesStored } = this;
        if (maxMessagesStored % 50 != 0)
            throw Error("Max messages to store must be a multiple of 50.");
        let messages = [];
        let nextToken = undefined;
        for (let i = 0; i < maxMessages / 50; i += 50) {
            const response = await this.getTurnsBatch(nextToken, pinnedOnly);
            const { turns } = response;
            if (!turns)
                break;
            if (turns["length"] == 0)
                break;
            nextToken = response?.meta?.next_token;
            for (let j = 0; j < turns.length; j++)
                messages.push(new CAIMessage(this.client, this, turns[j]));
        }
        return messages;
    }
    // keeps up to date with messages. this WILL wipe old messages
    async refreshMessages() {
        if (this.frozen)
            return;
        const { maxMessagesStored } = this;
        if (maxMessagesStored % 50 != 0)
            throw Error("Max messages to store must be a multiple of 50.");
        this.frozen = true;
        this.processingMessages = [];
        this.messageIds = [];
        this.client.markChatAsActive(this);
        const messages = await this.fetchMessagesViaQuery(false);
        for (let i = 0; i < messages.length; i++)
            this.addMessage(messages[i]);
        const pinnedMessages = await this.getPinnedMessages();
        for (let i = 0; i < pinnedMessages.length; i++)
            this.processingMessages[i].isPinned = true;
        this.cachedMessages = this.processingMessages;
        this.frozen = false;
    }
    async sendMessage(_content, _options) {
        // DO NOT touch this. This is abstract/virtual behavior for higher level conversations (DM/Group)
        return new CAIMessage(this.client, this, {});
    }
    async getPinnedMessages() {
        return await this.fetchMessagesViaQuery(true);
    }
    async rename(_newName) {
        // This is an abstract placeholder for higher level conversations (DM/Group), do not touch
    }
    async regenerateMessage(_message) {
        // This is an abstract placeholder for higher level conversations (DM/Group), do not touch
        return new CAIMessage(this.client, new Conversation(this.client, {}), {});
    }
    async reset() {
        return await this.deleteMessagesInBulk(await this.fetchMessagesViaQuery(false, 999999));
    }
    async deleteTurns(turnIds, refreshMessages) {
        await this.client.sendDMWebsocketCommandAsync({
            command: "remove_turns",
            originId: "Android",
            streaming: false,
            waitForAIResponse: false,
            payload: {
                chat_id: this.chatId,
                turn_ids: turnIds,
            },
        });
        if (refreshMessages)
            await this.refreshMessages();
    }
    async deleteMessagesInBulk(input, refreshMessages = true) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        Warnings.show("deletingInBulk");
        let turnIds = [];
        if (typeof input == "number") {
            if (input <= 0 || input >= this.maxMessagesStored)
                throw new Error("Invalid deletion range. The input number must be positive and reach within your messageCache limit.");
            // 200 - 50 for example
            const messageCount = this.messages.length;
            const fetchedMessages = this.messages.slice(messageCount - input, messageCount);
            turnIds = fetchedMessages.map((message) => message.turnId);
        }
        else if (Array.isArray(input)) {
            // if its a string instance, just copy and paste
            let assumedArray = input;
            if (assumedArray.every((item) => typeof item === "string"))
                turnIds = assumedArray;
            // if instance, get all ids
            if (assumedArray.every((item) => item instanceof CAIMessage))
                turnIds = assumedArray.map((message) => message.turnId);
        }
        if (turnIds.length == 0)
            return;
        return await this.deleteTurns(turnIds, refreshMessages);
    }
    async deleteMessageById(turnId, refreshMessages = true) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        return await this.deleteMessagesInBulk([turnId], refreshMessages);
    }
    async deleteMessage(message, refreshMessages = true) {
        return this.deleteMessageById(message.turnId, refreshMessages);
    }
    constructor(client, information) {
        super();
        this.client = client;
        ObjectPatcher.patch(this.client, this, information);
    }
}
__decorate([
    hiddenProperty
], Conversation.prototype, "client", void 0);
__decorate([
    hiddenProperty
], Conversation.prototype, "maxMessagesStored", void 0);
__decorate([
    hiddenProperty
], Conversation.prototype, "cachedMessages", void 0);
__decorate([
    hiddenProperty
], Conversation.prototype, "processingMessages", void 0);
__decorate([
    hiddenProperty
], Conversation.prototype, "messageIds", void 0);
__decorate([
    hiddenProperty
], Conversation.prototype, "chat_id", void 0);
__decorate([
    getterProperty
], Conversation.prototype, "chatId", null);
__decorate([
    hiddenProperty
], Conversation.prototype, "create_time", void 0);
__decorate([
    getterProperty
], Conversation.prototype, "creationDate", null);
__decorate([
    hiddenProperty
], Conversation.prototype, "creator_id", void 0);
__decorate([
    getterProperty
], Conversation.prototype, "creatorId", null);
__decorate([
    hiddenProperty
], Conversation.prototype, "character_id", void 0);
__decorate([
    getterProperty
], Conversation.prototype, "characterId", null);
__decorate([
    hiddenProperty
], Conversation.prototype, "preferred_model_type", void 0);
__decorate([
    getterProperty
], Conversation.prototype, "preferredModelType", null);
//# sourceMappingURL=conversation.js.map