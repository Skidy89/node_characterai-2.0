import { CharacterAI } from "../client.js";
import { hiddenProperty } from "../utils/specable.js";
import DMConversation from "./dmConversation.js";
import { CAIMessage } from "./message.js";

export class PreviewDMConversation extends DMConversation {
    // preview_turns
    @hiddenProperty
    private preview_turns = [];

    @hiddenProperty
    public previewTurns: CAIMessage[] = [];

    constructor(client: CharacterAI, information: any) {
        super(client, information);
        for (let i = 0; i < this.preview_turns.length; i++)
            this.previewTurns.push(new CAIMessage(client, this, this.preview_turns[i]));
    }
};