import { Conversation, ICAIMessageSending } from "./conversation.js";
import { CAIMessage } from "./message.js";
type CAIImageUploadResponse = {
    status: string;
    value: string;
};
export default class DMConversation extends Conversation {
    resurrect(): Promise<void>;
    archive(): Promise<void>;
    unarchive(refreshMessagesAfter?: boolean): Promise<DMConversation | void>;
    duplicate(): Promise<DMConversation>;
    rename(newName: string): Promise<void>;
    uploadImageToServer(input: string | Buffer): Promise<CAIImageUploadResponse>;
    sendMessage(content: string, options?: ICAIMessageSending, context?: {
        image?: CAIImageUploadResponse;
    }): Promise<CAIMessage>;
    regenerateMessage(message: CAIMessage): Promise<CAIMessage>;
}
export {};
//# sourceMappingURL=dmConversation.d.ts.map