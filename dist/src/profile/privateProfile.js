var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CheckAndThrow } from "../client.js";
import Parser from "../parser.js";
import { getterProperty, hiddenProperty } from "../utils/specable.js";
export class PrivateProfile {
    client;
    // username
    username = "";
    // id
    id = 0;
    get userId() {
        return this.id;
    }
    set userId(value) {
        this.id = value;
    }
    async refreshProfile() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        const request = await this.client.requester.request("https://plus.character.ai/chat/user/", {
            method: "GET",
            includeAuthorization: true,
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(response);
        const { user } = response.user;
        this.loadFromInformation(user);
        this.loadFromInformation(user.user);
    }
    loadFromInformation(information) {
        if (!information)
            return;
        Object.assign(this, information);
    }
    constructor(client) {
        this.client = client;
    }
}
__decorate([
    hiddenProperty
], PrivateProfile.prototype, "client", void 0);
__decorate([
    hiddenProperty
], PrivateProfile.prototype, "id", void 0);
__decorate([
    getterProperty
], PrivateProfile.prototype, "userId", null);
//# sourceMappingURL=privateProfile.js.map