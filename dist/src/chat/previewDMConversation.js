var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { hiddenProperty } from "../utils/specable.js";
import DMConversation from "./dmConversation.js";
import { CAIMessage } from "./message.js";
export class PreviewDMConversation extends DMConversation {
    // preview_turns
    preview_turns = [];
    previewTurns = [];
    constructor(client, information) {
        super(client, information);
        for (let i = 0; i < this.preview_turns.length; i++)
            this.previewTurns.push(new CAIMessage(client, this, this.preview_turns[i]));
    }
}
__decorate([
    hiddenProperty
], PreviewDMConversation.prototype, "preview_turns", void 0);
__decorate([
    hiddenProperty
], PreviewDMConversation.prototype, "previewTurns", void 0);
//# sourceMappingURL=previewDMConversation.js.map