import { CharacterAI } from "../client.js";
import { Specable } from "../utils/specable.js";
import { CAIMessage } from "./message.js";
export declare enum AnnotationStars {
    Remove = 0,
    One = 1,
    Two = 2,
    Three = 3,
    Four = 4
}
export declare enum AnnotationValue {
    Boring = "boring",
    Repetitive = "repetitive",
    BadMemory = "bad_memory",
    TooShort = "short",
    NotTrue = "inaccurate",
    OutOfCharacter = "out_of_character",
    TooLong = "long",
    EndedChatEarly = "ends_chat_early",
    Funny = "funny",
    Helpful = "helpful",
    Interesting = "interesting",
    GoodMemory = "good_memory"
}
export declare class Candidate extends Specable {
    protected client: CharacterAI;
    protected message: CAIMessage;
    private candidate_id;
    get candidateId(): string;
    set candidateId(value: string);
    private create_time;
    get creationDate(): Date;
    private raw_content;
    get content(): string;
    set content(value: string);
    private is_final;
    get isFinal(): boolean;
    set isFinal(value: boolean);
    private safety_truncated;
    get wasFlagged(): boolean;
    set wasFlagged(value: boolean);
    createAnnotation(annotation: AnnotationStars | AnnotationValue | string): Promise<any>;
    removeAnnotation(annotationId: string): Promise<void>;
    private internalGetTTSUrl;
    setPrimary(): Promise<void>;
    getTTSUrlWithQuery(voiceQuery?: string): Promise<string>;
    getTTSUrl(voiceId: string): Promise<string>;
    constructor(client: CharacterAI, message: CAIMessage, information: any);
}
export declare class EditedCandidate extends Candidate {
    private base_candidate_id;
    get baseCandidateId(): string;
    set baseCandidateId(value: string);
    private editor;
    get editorAuthorId(): {
        authorId: any;
    };
}
//# sourceMappingURL=candidate.d.ts.map