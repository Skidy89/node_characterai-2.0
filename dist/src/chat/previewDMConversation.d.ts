import { CharacterAI } from "../client.js";
import DMConversation from "./dmConversation.js";
import { CAIMessage } from "./message.js";
export declare class PreviewDMConversation extends DMConversation {
    private preview_turns;
    previewTurns: CAIMessage[];
    constructor(client: CharacterAI, information: any);
}
//# sourceMappingURL=previewDMConversation.d.ts.map