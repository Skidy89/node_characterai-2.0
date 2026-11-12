var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CheckAndThrow } from "../client.js";
import Parser from "../parser.js";
import ObjectPatcher from "../utils/patcher.js";
import { getterProperty, hiddenProperty, Specable } from "../utils/specable.js";
export var AnnotationStars;
(function (AnnotationStars) {
    AnnotationStars[AnnotationStars["Remove"] = 0] = "Remove";
    AnnotationStars[AnnotationStars["One"] = 1] = "One";
    AnnotationStars[AnnotationStars["Two"] = 2] = "Two";
    AnnotationStars[AnnotationStars["Three"] = 3] = "Three";
    AnnotationStars[AnnotationStars["Four"] = 4] = "Four";
})(AnnotationStars || (AnnotationStars = {}));
export var AnnotationValue;
(function (AnnotationValue) {
    AnnotationValue["Boring"] = "boring";
    AnnotationValue["Repetitive"] = "repetitive";
    AnnotationValue["BadMemory"] = "bad_memory";
    AnnotationValue["TooShort"] = "short";
    AnnotationValue["NotTrue"] = "inaccurate";
    AnnotationValue["OutOfCharacter"] = "out_of_character";
    AnnotationValue["TooLong"] = "long";
    AnnotationValue["EndedChatEarly"] = "ends_chat_early";
    AnnotationValue["Funny"] = "funny";
    AnnotationValue["Helpful"] = "helpful";
    AnnotationValue["Interesting"] = "interesting";
    AnnotationValue["GoodMemory"] = "good_memory";
})(AnnotationValue || (AnnotationValue = {}));
export class Candidate extends Specable {
    client;
    message;
    // candidate_id
    candidate_id = "";
    get candidateId() {
        return this.candidate_id;
    }
    set candidateId(value) {
        this.candidate_id = value;
    }
    // create_time
    create_time = "";
    get creationDate() {
        return new Date(this.create_time);
    }
    // raw_content
    raw_content = "";
    get content() {
        return this.raw_content;
    }
    set content(value) {
        this.raw_content = value;
    }
    // is_final
    is_final = true;
    get isFinal() {
        return this.is_final;
    }
    set isFinal(value) {
        this.is_final = value;
    }
    // safety_truncated
    safety_truncated = false;
    get wasFlagged() {
        return this.safety_truncated;
    }
    set wasFlagged(value) {
        this.safety_truncated = value;
    }
    // annotation
    async createAnnotation(annotation) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const isAnnotationString = typeof annotation == "string";
        const isAnnotationStars = Object.values(AnnotationStars).includes(annotation);
        const request = await this.client.requester.request("https://neo.character.ai/annotation/create", {
            method: "POST",
            includeAuthorization: true,
            body: Parser.stringify({
                annotation: {
                    annotation_type: isAnnotationString
                        ? isAnnotationStars
                            ? "custom"
                            : annotation
                        : "star",
                    ...(isAnnotationString
                        ? { annotation_raw_content: annotation }
                        : undefined),
                    annotation_value: isAnnotationString ? 1 : annotation,
                },
                candidate_id: this.candidateId,
                turn_key: {
                    chat_id: this.message.turnKey.chatId,
                    turn_id: this.message.turnKey.turnId,
                },
            }),
            contentType: "application/json",
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(String(response));
        return response.annotation.annotation_id;
    }
    async removeAnnotation(annotationId) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.client.requester.request("https://neo.character.ai/annotation/remove", {
            method: "POST",
            includeAuthorization: true,
            body: Parser.stringify({
                annotation_id: annotationId,
                candidate_id: this.candidateId,
                turn_key: {
                    chat_id: this.message.turnKey.chatId,
                    turn_id: this.message.turnKey.turnId,
                },
            }),
            contentType: "application/json",
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(String(response));
    }
    // https://neo.character.ai/multimodal/api/v1/memo/replay
    async internalGetTTSUrl(voiceId, voiceQuery) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.client.requester.request("https://neo.character.ai/multimodal/api/v1/memo/replay", {
            method: "POST",
            includeAuthorization: true,
            body: Parser.stringify({
                candidateId: this.candidateId,
                roomId: this.message.chatId,
                turnId: this.message.turnId,
                voiceId,
                voiceQuery,
            }),
            contentType: "application/json",
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(response);
        return response.replayUrl;
    }
    async setPrimary() {
        if (this.message.primaryCandidate == this)
            return;
        await this.message.switchPrimaryCandidateTo(this.candidateId);
    }
    // TTS
    async getTTSUrlWithQuery(voiceQuery) {
        return await this.internalGetTTSUrl(undefined, voiceQuery ?? "");
    }
    async getTTSUrl(voiceId) {
        return await this.internalGetTTSUrl(voiceId);
    }
    constructor(client, message, information) {
        super();
        this.client = client;
        this.message = message;
        ObjectPatcher.patch(client, this, information);
    }
}
__decorate([
    hiddenProperty
], Candidate.prototype, "client", void 0);
__decorate([
    hiddenProperty
], Candidate.prototype, "message", void 0);
__decorate([
    hiddenProperty
], Candidate.prototype, "candidate_id", void 0);
__decorate([
    getterProperty
], Candidate.prototype, "candidateId", null);
__decorate([
    hiddenProperty
], Candidate.prototype, "create_time", void 0);
__decorate([
    getterProperty
], Candidate.prototype, "creationDate", null);
__decorate([
    hiddenProperty
], Candidate.prototype, "raw_content", void 0);
__decorate([
    getterProperty
], Candidate.prototype, "content", null);
__decorate([
    hiddenProperty
], Candidate.prototype, "is_final", void 0);
__decorate([
    getterProperty
], Candidate.prototype, "isFinal", null);
__decorate([
    hiddenProperty
], Candidate.prototype, "safety_truncated", void 0);
__decorate([
    getterProperty
], Candidate.prototype, "wasFlagged", null);
export class EditedCandidate extends Candidate {
    // base_candidate_id?
    base_candidate_id = "";
    get baseCandidateId() {
        return this.base_candidate_id;
    }
    set baseCandidateId(value) {
        this.base_candidate_id = value;
    }
    // editor { author_id }?
    editor = {};
    get editorAuthorId() {
        return { authorId: this.editor.author_id };
    }
}
__decorate([
    hiddenProperty
], EditedCandidate.prototype, "base_candidate_id", void 0);
__decorate([
    getterProperty
], EditedCandidate.prototype, "baseCandidateId", null);
__decorate([
    hiddenProperty
], EditedCandidate.prototype, "editor", void 0);
__decorate([
    hiddenProperty
], EditedCandidate.prototype, "editorAuthorId", null);
//# sourceMappingURL=candidate.js.map