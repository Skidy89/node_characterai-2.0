var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import DMConversation from "../chat/dmConversation.js";
import { CheckAndThrow } from "../client.js";
import Parser from "../parser.js";
import { CAIImage as CAIImage } from "../utils/image.js";
import ObjectPatcher from "../utils/patcher.js";
import { getterProperty, hiddenProperty, Specable } from "../utils/specable.js";
import { v4 as uuidv4 } from "uuid";
import { CharacterVisibility, CharacterVote, } from "./characterEnums.js";
export class Character extends Specable {
    client;
    // external_id / character_id
    external_id = "";
    set character_id(value) {
        this.external_id = value;
    }
    get externalId() {
        return this.external_id;
    }
    set externalId(value) {
        this.external_id = value;
    }
    get characterId() {
        return this.external_id;
    }
    set characterId(value) {
        this.external_id = value;
    }
    // title aka tagline
    title = "";
    get tagline() {
        return this.title;
    }
    set tagline(value) {
        this.title = value;
    }
    // description
    description = "";
    // identifier
    identifier = "";
    // character_visibility / visibility
    visibility = CharacterVisibility.Public;
    set character_visibility(value) {
        this.visibility = value;
    }
    // copyable
    copyable = false;
    // greeting
    greeting = "";
    // avatar_file_name
    avatar;
    // songs (no type found)
    songs = [];
    // img_gen_enabled
    img_gen_enabled = false;
    get imageGenerationEnabled() {
        return this.img_gen_enabled;
    }
    set imageGenerationEnabled(value) {
        this.img_gen_enabled = value;
    }
    // dynamic_greeting_enabled
    dynamic_greeting_enabled = undefined;
    allow_dynamic_greeting = undefined;
    get dynamicGreetingEnabled() {
        return this.dynamic_greeting_enabled ?? this.allow_dynamic_greeting;
    }
    set dynamicGreetingEnabled(value) {
        if (this.dynamic_greeting_enabled)
            this.dynamic_greeting_enabled = value;
        if (this.allow_dynamic_greeting)
            this.allow_dynamic_greeting = value;
    }
    // base_image_prompt
    base_img_prompt = "";
    get baseImagePrompt() {
        return this.base_img_prompt;
    }
    set baseImagePrompt(value) {
        this.base_img_prompt = value;
    }
    // img_prompt_regex
    img_prompt_regex = "";
    get imagePromptRegex() {
        return this.img_prompt_regex;
    }
    set imagePromptRegex(value) {
        this.img_prompt_regex = value;
    }
    // strip_img_prompt_from_msg
    strip_img_prompt_from_msg = false;
    get stripImagePromptFromMessage() {
        return this.strip_img_prompt_from_msg;
    }
    set stripImagePromptFromMessage(value) {
        this.strip_img_prompt_from_msg = value;
    }
    // starter_prompts
    starter_prompts = [];
    get starterPrompts() {
        return this.starter_prompts;
    }
    set starterPrompts(value) {
        this.starter_prompts = value;
    }
    // comments_enabled
    comments_enabled = true;
    get commentsEnabled() {
        return this.comments_enabled;
    }
    set commentsEnabled(value) {
        this.comments_enabled = value;
    }
    // short_hash
    short_hash = "";
    get shortHash() {
        return this.short_hash;
    }
    set shortHash(value) {
        this.short_hash = value;
    }
    // short_hash
    usage = "default";
    // definition
    definition = "";
    // default_voice_id
    default_voice_id = "";
    get defaultVoiceId() {
        return this.default_voice_id;
    }
    set defaultVoiceId(value) {
        this.default_voice_id = value;
    }
    // participant__name / aka display name
    // name
    participant__name = undefined;
    name = undefined;
    participant__user__username = undefined;
    character_name = undefined;
    get displayName() {
        return (this.participant__name ??
            this.name ??
            this.participant__user__username ??
            this.character_name);
    }
    set displayName(value) {
        if (this.participant__name)
            this.participant__name = value;
        if (this.name)
            this.name = value;
        if (this.participant__user__username)
            this.participant__user__username = value;
        if (this.character_name)
            this.character_name = value;
    }
    // user__username / aka author
    user__username = "";
    // participant__num_interactions
    // num_interactions
    participant__num_interactions = undefined;
    num_interactions = undefined;
    get interactionCount() {
        return this.participant__num_interactions ?? this.num_interactions;
    }
    set interactionCount(value) {
        if (this.participant__num_interactions)
            this.participant__num_interactions = value;
        if (this.num_interactions)
            this.num_interactions = value;
    }
    // num_likes
    num_likes = 0;
    get likeCount() {
        return this.num_likes;
    }
    // num_interactions_last_day
    num_interactions_last_day = 0;
    get interactionCountLastDay() {
        return this.num_interactions_last_day;
    }
    // has_definition
    has_definition = false;
    get hasDefinition() {
        return this.has_definition;
    }
    // safety
    safety = "SAFE";
    // user_id / creator_id
    user__id = 0;
    set creator_id(value) {
        this.user__id = value;
    }
    get userId() {
        return this.user__id;
    }
    set userId(value) {
        this.user__id = value;
    }
    // is_licensed_professional
    is_licensed_professional = false;
    get isLicensedProfessional() {
        return this.is_licensed_professional;
    }
    // upvotes
    upvotes = 0;
    // translations / character_translations
    translations = null;
    set character_translations(value) {
        this.translations = value;
    }
    async getDefaultVoice() {
        return undefined;
    }
    /// features
    async getDMs(turnPreviewCount = 2) {
        // refresh chats refreshes for get dms, might make longer
        const request = await this.client.requester.request(`https://neo.character.ai/chats/?character_ids=${this.characterId}?num_preview_turns=${turnPreviewCount}`, {
            method: "GET",
            includeAuthorization: true,
            contentType: "application/json",
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(response);
        const { chats } = response;
        const dms = [];
        for (let i = 0; i < chats.length; i++) {
            dms.push(chats[i]);
        }
        return dms;
    }
    // create new converstaion to false will fetch the latest conversation
    async internalDM(createNewConversation, withGreeting, specificChatId) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        var conversation;
        if (specificChatId)
            conversation = undefined; // fetchDMConversation removed
        // create conversation
        if (createNewConversation) {
            const request = await this.client.sendDMWebsocketCommandAsync({
                command: "create_chat",
                originId: "Android",
                streaming: true,
                payload: {
                    chat: {
                        chat_id: uuidv4(),
                        creator_id: this.client.myProfile.userId.toString(),
                        visibility: "VISIBILITY_PRIVATE",
                        character_id: this.characterId,
                        type: "TYPE_ONE_ON_ONE",
                    },
                    with_greeting: withGreeting ?? true,
                },
            });
            conversation = new DMConversation(this.client, request[0].chat);
        }
        // if no chat id after allat, lets fetch the most recent one
        if (!specificChatId)
            conversation = await this.client.fetchLatestDMConversationWith(this.characterId);
        await conversation?.resurrect();
        await conversation?.refreshMessages();
        return conversation;
    }
    async createDM(withGreeting) {
        return await this.internalDM(true, withGreeting);
    }
    async DM(specificChatId) {
        return await this.internalDM(false, false, specificChatId);
    }
    async getAuthorProfile() {
        const username = this.user__username;
        const myProfile = this.client.myProfile;
        return username == myProfile.username ? myProfile : undefined;
    }
    async getVote() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.client.requester.request(`https://plus.character.ai/chat/character/${this.characterId}/voted/`, {
            method: "GET",
            includeAuthorization: true,
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(String(response));
        const vote = response["vote"];
        switch (vote) {
            case true:
                return CharacterVote.Like;
            case false:
                return CharacterVote.Dislike;
        }
        return CharacterVote.None;
    }
    async setVote() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        throw new Error("Not available");
    }
    async hide() {
        // (plus) /chat/character/hide
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        throw new Error("Not available");
    }
    // voice instance or voiceId
    // https://plus.character.ai/chat/character/${characterId}/voice_override/update/
    async setVoiceOverride(voiceOrId) {
        let voiceId = voiceOrId;
        const request = await this.client.requester.request(`https://plus.character.ai/chat/character/${this.characterId}/voice_override/update/`, {
            method: "POST",
            includeAuthorization: true,
            contentType: "application/json",
            body: Parser.stringify({ voice_id: voiceId }),
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(String(response));
        if (!response.success)
            throw new Error("Could set voice override");
    }
    async getVoiceOverride() {
        return undefined; // fetchSettings removed
    }
    // https://neo.character.ai/recommendation/v1/character/id
    async getSimilarCharacters() {
        return undefined;
    } // getSimilarCharactersTo removed
    async report(reason, additionalDetails = "") {
        const request = await this.client.requester.request(`https://neo.character.ai/report/create`, {
            method: "POST",
            body: Parser.stringify({
                category: reason,
                comments: additionalDetails,
                reported_resource_id: this.characterId,
                type: "CHARACTER",
            }),
            includeAuthorization: true,
            contentType: "application/json",
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(response);
        return response.report.report_id;
    }
    // /chat/character/update/
    async internalEdit(_isDelete, _options) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        throw new Error("Not available");
    }
    async edit(options) {
        return await this.internalEdit(false, options);
    }
    async delete() {
        return await this.internalEdit(true);
    }
    // persona
    async setPersonaOverride(_personaOrId) {
        throw new Error("Not available"); // setPersonaOverrideFor removed
    }
    async getPersonaOverride() {
        return undefined; // getPersonaOverrideFor removed
    }
    constructor(client, information) {
        super();
        this.client = client;
        // can edit profile picture
        this.avatar = new CAIImage(client, () => this.creator_id != this.client.myProfile.userId &&
            this.user__username != this.client.myProfile.username);
        ObjectPatcher.patch(this.client, this, information);
        if ("is_licensed_professional" in information)
            this.is_licensed_professional = information.is_licensed_professional;
        if ("character_id" in information)
            this.character_id = information.character_id;
        if ("character_visibility" in information)
            this.character_visibility = information.character_visibility;
        if ("character_translations" in information)
            this.character_translations = information.character_translations;
    }
}
__decorate([
    hiddenProperty
], Character.prototype, "client", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "external_id", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "character_id", null);
__decorate([
    getterProperty
], Character.prototype, "externalId", null);
__decorate([
    getterProperty
], Character.prototype, "characterId", null);
__decorate([
    getterProperty
], Character.prototype, "tagline", null);
__decorate([
    hiddenProperty
], Character.prototype, "character_visibility", null);
__decorate([
    hiddenProperty
], Character.prototype, "avatar", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "img_gen_enabled", void 0);
__decorate([
    getterProperty
], Character.prototype, "imageGenerationEnabled", null);
__decorate([
    hiddenProperty
], Character.prototype, "dynamic_greeting_enabled", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "allow_dynamic_greeting", void 0);
__decorate([
    getterProperty
], Character.prototype, "dynamicGreetingEnabled", null);
__decorate([
    hiddenProperty
], Character.prototype, "base_img_prompt", void 0);
__decorate([
    getterProperty
], Character.prototype, "baseImagePrompt", null);
__decorate([
    hiddenProperty
], Character.prototype, "img_prompt_regex", void 0);
__decorate([
    getterProperty
], Character.prototype, "imagePromptRegex", null);
__decorate([
    hiddenProperty
], Character.prototype, "strip_img_prompt_from_msg", void 0);
__decorate([
    getterProperty
], Character.prototype, "stripImagePromptFromMessage", null);
__decorate([
    hiddenProperty
], Character.prototype, "starter_prompts", void 0);
__decorate([
    getterProperty
], Character.prototype, "starterPrompts", null);
__decorate([
    hiddenProperty
], Character.prototype, "comments_enabled", void 0);
__decorate([
    getterProperty
], Character.prototype, "commentsEnabled", null);
__decorate([
    hiddenProperty
], Character.prototype, "short_hash", void 0);
__decorate([
    getterProperty
], Character.prototype, "shortHash", null);
__decorate([
    hiddenProperty
], Character.prototype, "default_voice_id", void 0);
__decorate([
    getterProperty
], Character.prototype, "defaultVoiceId", null);
__decorate([
    hiddenProperty
], Character.prototype, "participant__name", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "name", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "participant__user__username", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "character_name", void 0);
__decorate([
    getterProperty
], Character.prototype, "displayName", null);
__decorate([
    hiddenProperty
], Character.prototype, "user__username", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "participant__num_interactions", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "num_interactions", void 0);
__decorate([
    getterProperty
], Character.prototype, "interactionCount", null);
__decorate([
    hiddenProperty
], Character.prototype, "num_likes", void 0);
__decorate([
    getterProperty
], Character.prototype, "likeCount", null);
__decorate([
    hiddenProperty
], Character.prototype, "num_interactions_last_day", void 0);
__decorate([
    getterProperty
], Character.prototype, "interactionCountLastDay", null);
__decorate([
    hiddenProperty
], Character.prototype, "has_definition", void 0);
__decorate([
    getterProperty
], Character.prototype, "hasDefinition", null);
__decorate([
    hiddenProperty
], Character.prototype, "user__id", void 0);
__decorate([
    hiddenProperty
], Character.prototype, "creator_id", null);
__decorate([
    hiddenProperty
], Character.prototype, "is_licensed_professional", void 0);
__decorate([
    getterProperty
], Character.prototype, "isLicensedProfessional", null);
__decorate([
    hiddenProperty
], Character.prototype, "character_translations", null);
export { CharacterVisibility };
//# sourceMappingURL=character.js.map