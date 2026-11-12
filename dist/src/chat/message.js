var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { getterProperty, hiddenProperty, Specable } from "../utils/specable.js";
import { CheckAndThrow } from "../client.js";
import ObjectPatcher from "../utils/patcher.js";
import { Candidate, EditedCandidate } from "./candidate.js";
import Parser from "../parser.js";
import DMConversation from "./dmConversation.js";
import Warnings from "../warnings.js";
export class CAIMessage extends Specable {
    client;
    conversation;
    // turn_key
    turn_key = {};
    get turnKey() {
        return {
            chatId: this.turn_key.chat_id,
            turnId: this.turn_key.turn_id,
        };
    }
    get turnId() {
        return this.turnKey.turnId;
    }
    get chatId() {
        return this.turnKey.chatId;
    }
    get text() {
        return this.text;
    }
    // create_time
    create_time = "";
    get creationDate() {
        return new Date(this.create_time);
    }
    // last_update_time
    last_update_time = "";
    get lastUpdateDate() {
        return new Date(this.last_update_time);
    }
    // state
    state = "STATE_OK";
    // author
    author = {};
    get authorId() {
        return this.author.author_id;
    }
    get isHuman() {
        return this.author.is_human ?? false;
    }
    get authorUsername() {
        return this.author.name;
    }
    // is_pinned
    is_pinned = false;
    get isPinned() {
        return this.is_pinned;
    }
    set isPinned(value) {
        this.is_pinned = value;
    }
    async getAuthorProfile() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const { isHuman } = this;
        if (!isHuman)
            throw Error("Failed to fetch author because this is message was not made by a human.");
        return undefined; // fetchProfileByUsername removed
    }
    async getCharacter() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const { authorId, isHuman } = this;
        if (isHuman)
            throw Error("Failed to fetch character because this is message was not made by a character.");
        return await this.client.fetchCharacter(authorId);
    }
    // candidates
    // |_ candidate_id
    // |_ create_time
    // |_ raw_content?
    // |_ is_final?
    candidates = [];
    // the main request forces you to use candidates
    candidateIdToCandidate = {};
    // the way candidates work is basically the messages that get edited you have
    // a way to select between 1/30 candidates and [0] will always be the latest candidate
    // turn key is the identifier that holds them (aka a "message.id")
    // combo is chat id + turn key but we already have the chat id
    // turn keys are indexed by the conversation
    // this function will index candidates and give them proper instances
    addCandidate(candidateObject, addAfterToActualRawCandidates) {
        const isEditedCandidate = this.candidates.length > 1;
        const candidate = isEditedCandidate
            ? new EditedCandidate(this.client, this, candidateObject)
            : new Candidate(this.client, this, candidateObject);
        if (candidate.wasFlagged)
            Warnings.show("contentFiltered");
        this.candidateIdToCandidate[candidate.candidateId] = candidate;
        if (addAfterToActualRawCandidates)
            this.candidates.unshift(candidateObject);
    }
    indexCandidates() {
        this.candidateIdToCandidate = {};
        for (let i = 0; i < this.candidates.length; i++) {
            const candidateObject = this.candidates[i];
            this.addCandidate(candidateObject, false); // we use previously added, no need to readd
        }
    }
    getCandidateByTurnId(turnId) {
        const candidate = this.candidateIdToCandidate[turnId];
        if (!candidate)
            throw new Error("Candidate not found");
        return candidate;
    }
    getCandidates() {
        // create copy to avoid modification
        return { ...this.candidateIdToCandidate };
    }
    // get primaryCandidate
    // content is influenced by the primary candidate to save time/braincells
    get content() {
        return this.primaryCandidate?.content ?? "";
    }
    get wasFlagged() {
        return this.primaryCandidate?.wasFlagged ?? false;
    }
    // primary_candidate_id
    primary_candidate_id = "";
    get primaryCandidate() {
        return this.getCandidateByTurnId(this.primary_candidate_id);
    }
    // use specific candidate id to change specific id or it will change the latest
    async edit(newContent, specificCandidateId) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const candidateId = specificCandidateId ?? this.primaryCandidate.candidateId;
        let request;
        if (this.conversation instanceof DMConversation) {
            request = await this.client.sendDMWebsocketCommandAsync({
                command: "edit_turn_candidate",
                originId: "Android",
                streaming: true,
                waitForAIResponse: false,
                payload: {
                    turn_key: this.turn_key,
                    current_candidate_id: candidateId,
                    new_candidate_raw_content: newContent,
                },
            });
        }
        else {
        }
        this.candidates = request.pop().turn.candidates;
        this.indexCandidates();
    }
    // next/previous/candidate_id
    async internalSwitchPrimaryCandidate(candidate) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        let candidateId = candidate;
        let candidates = this.getCandidates();
        const candidateValues = Object.values(candidates);
        const primaryCandidateIndex = Object.keys(candidates).indexOf(this.primary_candidate_id);
        if (primaryCandidateIndex != -1) {
            if (candidate == "next")
                candidateId =
                    candidateValues[primaryCandidateIndex + 1]?.candidateId ?? "";
            if (candidate == "previous")
                candidateId =
                    candidateValues[primaryCandidateIndex - 1]?.candidateId ?? "";
        }
        if (candidateId.trim() == "")
            throw new Error("Cannot find the message, it is invalid or it is out of range.");
        const firstRequest = await this.client.requester.request(`https://neo.character.ai/annotations/${this.conversation.chatId}/${this.turnId}/${candidateId}`, {
            method: "POST",
            contentType: "application/json",
            body: "{}",
            includeAuthorization: true,
        });
        const firstResponse = await Parser.parseJSON(firstRequest);
        if (!firstRequest.ok)
            throw new Error(firstResponse);
        await this.client.sendDMWebsocketCommandAsync({
            command: "update_primary_candidate",
            originId: "Android",
            streaming: false,
            waitForAIResponse: true,
            expectedReturnCommand: "ok",
            payload: {
                candidate_id: candidateId,
                turn_key: this.turn_key,
            },
        });
        this.primary_candidate_id = candidate;
        this.indexCandidates();
        return this.primaryCandidate;
    }
    async switchToPreviousCandidate() {
        return this.internalSwitchPrimaryCandidate("previous");
    }
    async switchToNextCandidate() {
        return this.internalSwitchPrimaryCandidate("next");
    }
    async switchPrimaryCandidateTo(candidateId) {
        return await this.internalSwitchPrimaryCandidate(candidateId);
    }
    async regenerate() {
        return this.conversation.regenerateMessage(this);
    }
    getConversationMessageAfterIndex(offset) {
        const conversationMessageIds = this.conversation.messageIds;
        let index = conversationMessageIds.indexOf(this.turnId);
        if (index == -1)
            return null;
        index += offset;
        if (index < 0 || index >= conversationMessageIds.length)
            return null;
        return this.conversation.messages[index];
    }
    getMessageBefore() {
        return this.getConversationMessageAfterIndex(-1);
    }
    getMessageAfter() {
        return this.getConversationMessageAfterIndex(1);
    }
    async getAllMessagesAfter() {
        const conversationMessageIds = this.conversation.messageIds;
        const index = conversationMessageIds.indexOf(this.turnId);
        if (index == -1)
            return [];
        let messagesAfter = [];
        // FIXME: might wanna not use the cache for that one
        for (let i = index; i < conversationMessageIds.length; i++)
            messagesAfter.push(this.conversation.messages[i]);
        return messagesAfter;
    }
    async handlePin(isPinned) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        if (this.isPinned == isPinned)
            return;
        await this.client.sendDMWebsocketCommandAsync({
            command: "set_turn_pin",
            originId: "Android",
            streaming: false,
            waitForAIResponse: false,
            payload: {
                turn_key: this.turn_key,
                is_pinned: isPinned,
            },
        });
        this.isPinned = isPinned;
    }
    async pin() {
        await this.handlePin(true);
    }
    async unpin() {
        await this.handlePin(false);
    }
    // https://neo.character.ai/chat/id/copy
    async copyFromHere(isDM = true) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.client.requester.request(`https://neo.character.ai/chat/${this.conversation.chatId}/copy`, {
            method: "POST",
            contentType: "application/json",
            body: Parser.stringify({ end_turn_id: this.turnId }),
            includeAuthorization: true,
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(String(response));
        const { new_chat_id: newChatId } = response;
        return isDM
            ? await this.client.fetchLatestDMConversationWith(newChatId)
            : undefined; // fetchGroupChatConversation removed
    }
    async rewindFromHere() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        if (this.conversation.getLastMessage()?.turnId == this.turnId)
            throw new Error("You cannot rewind from the last message in the conversation.");
        return await this.conversation.deleteMessagesInBulk(await this.getAllMessagesAfter());
    }
    async delete() {
        return await this.conversation.deleteMessage(this);
    }
    // TTS
    async getTTSUrlWithQuery(voiceQuery) {
        return await this.primaryCandidate.getTTSUrlWithQuery(voiceQuery);
    }
    async getTTSUrl(voiceId) {
        return await this.primaryCandidate.getTTSUrl(voiceId);
    }
    /**
     * Patches and indexes an unsanitized turn.
     * @remarks **Do not use this method.** It is meant for internal use only.
     */
    indexTurn(turn) {
        ObjectPatcher.patch(this.client, this, turn);
        this.indexCandidates();
    }
    constructor(client, conversation, turn) {
        super();
        this.client = client;
        this.conversation = conversation;
        this.indexTurn(turn);
    }
}
__decorate([
    hiddenProperty
], CAIMessage.prototype, "client", void 0);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "conversation", void 0);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "turn_key", void 0);
__decorate([
    getterProperty
], CAIMessage.prototype, "turnKey", null);
__decorate([
    getterProperty
], CAIMessage.prototype, "turnId", null);
__decorate([
    getterProperty
], CAIMessage.prototype, "chatId", null);
__decorate([
    getterProperty
], CAIMessage.prototype, "text", null);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "create_time", void 0);
__decorate([
    getterProperty
], CAIMessage.prototype, "creationDate", null);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "last_update_time", void 0);
__decorate([
    getterProperty
], CAIMessage.prototype, "lastUpdateDate", null);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "author", void 0);
__decorate([
    getterProperty
], CAIMessage.prototype, "authorId", null);
__decorate([
    getterProperty
], CAIMessage.prototype, "isHuman", null);
__decorate([
    getterProperty
], CAIMessage.prototype, "authorUsername", null);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "is_pinned", void 0);
__decorate([
    getterProperty
], CAIMessage.prototype, "isPinned", null);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "candidates", void 0);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "candidateIdToCandidate", void 0);
__decorate([
    hiddenProperty
], CAIMessage.prototype, "primary_candidate_id", void 0);
//# sourceMappingURL=message.js.map