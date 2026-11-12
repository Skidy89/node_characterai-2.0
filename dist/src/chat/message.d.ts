import { Specable } from "../utils/specable.js";
import { CharacterAI } from "../client.js";
import { Candidate } from "./candidate.js";
import { Conversation } from "./conversation.js";
import DMConversation from "./dmConversation.js";
export declare class CAIMessage extends Specable {
    private client;
    private conversation;
    private turn_key;
    get turnKey(): {
        chatId: any;
        turnId: any;
    };
    get turnId(): string;
    get chatId(): any;
    get text(): string;
    private create_time;
    get creationDate(): Date;
    private last_update_time;
    get lastUpdateDate(): Date;
    state: string;
    private author;
    get authorId(): any;
    get isHuman(): any;
    get authorUsername(): any;
    private is_pinned;
    get isPinned(): boolean;
    set isPinned(value: boolean);
    getAuthorProfile(): Promise<undefined>;
    getCharacter(): Promise<import("../index.js").Character>;
    private candidates;
    private candidateIdToCandidate;
    private addCandidate;
    private indexCandidates;
    private getCandidateByTurnId;
    getCandidates(): Record<string, Candidate>;
    get content(): string;
    get wasFlagged(): boolean;
    private primary_candidate_id;
    get primaryCandidate(): Candidate;
    edit(newContent: string, specificCandidateId?: string): Promise<void>;
    private internalSwitchPrimaryCandidate;
    switchToPreviousCandidate(): Promise<Candidate>;
    switchToNextCandidate(): Promise<Candidate>;
    switchPrimaryCandidateTo(candidateId: string): Promise<Candidate>;
    regenerate(): Promise<CAIMessage>;
    private getConversationMessageAfterIndex;
    getMessageBefore(): CAIMessage | null;
    getMessageAfter(): CAIMessage | null;
    private getAllMessagesAfter;
    private handlePin;
    pin(): Promise<void>;
    unpin(): Promise<void>;
    copyFromHere(isDM?: boolean): Promise<DMConversation | any>;
    rewindFromHere(): Promise<void>;
    delete(): Promise<void>;
    getTTSUrlWithQuery(voiceQuery?: string): Promise<string>;
    getTTSUrl(voiceId: string): Promise<string>;
    /**
     * Patches and indexes an unsanitized turn.
     * @remarks **Do not use this method.** It is meant for internal use only.
     */
    indexTurn(turn: any): void;
    constructor(client: CharacterAI, conversation: Conversation, turn: any);
}
//# sourceMappingURL=message.d.ts.map