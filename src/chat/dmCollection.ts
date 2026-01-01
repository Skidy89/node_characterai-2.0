import DMConversation from "./dmConversation.js";

export default interface IDMCollection {
    totalDMCount: number;

    conversations: DMConversation[];
    archivedConversations: DMConversation[];
    lastConversation: DMConversation;
    allConversations: DMConversation[];
};