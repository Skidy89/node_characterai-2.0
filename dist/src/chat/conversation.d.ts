import { Specable } from "../utils/specable.js";
import { CharacterAI } from "../client.js";
import { CAIImage } from "../utils/image.js";
import { CAIMessage } from "./message.js";
export interface ICAIConversationCreation {
    messages?: any[];
}
export declare enum ConversationState {
    Active = "STATE_ACTIVE",
    Archived = "STATE_ARCHIVED"
}
export declare enum ConversationVisibility {
    Public = "VISIBILITY_PUBLIC",
    Private = "VISIBILITY_PRIVATE"
}
export interface ICAIMessageSending {
    manualTurn?: boolean;
    image?: CAIImage;
    getMyMessageInstead?: boolean;
}
export declare class Conversation extends Specable {
    protected client: CharacterAI;
    maxMessagesStored: number;
    private cachedMessages;
    private processingMessages;
    messageIds: string[];
    get messages(): {
        [n: number]: CAIMessage;
        length: number;
        toString(): string;
        toLocaleString(): string;
        toLocaleString(locales: string | string[], options?: Intl.NumberFormatOptions & Intl.DateTimeFormatOptions): string;
        pop(): CAIMessage | undefined;
        push(...items: CAIMessage[]): number;
        concat(...items: ConcatArray<CAIMessage>[]): CAIMessage[];
        concat(...items: (CAIMessage | ConcatArray<CAIMessage>)[]): CAIMessage[];
        join(separator?: string): string;
        reverse(): CAIMessage[];
        shift(): CAIMessage | undefined;
        slice(start?: number, end?: number): CAIMessage[];
        sort(compareFn?: ((a: CAIMessage, b: CAIMessage) => number) | undefined): CAIMessage[];
        splice(start: number, deleteCount?: number): CAIMessage[];
        splice(start: number, deleteCount: number, ...items: CAIMessage[]): CAIMessage[];
        unshift(...items: CAIMessage[]): number;
        indexOf(searchElement: CAIMessage, fromIndex?: number): number;
        lastIndexOf(searchElement: CAIMessage, fromIndex?: number): number;
        every<S extends CAIMessage>(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => value is S, thisArg?: any): this is S[];
        every(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => unknown, thisArg?: any): boolean;
        some(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => unknown, thisArg?: any): boolean;
        forEach(callbackfn: (value: CAIMessage, index: number, array: CAIMessage[]) => void, thisArg?: any): void;
        map<U>(callbackfn: (value: CAIMessage, index: number, array: CAIMessage[]) => U, thisArg?: any): U[];
        filter<S extends CAIMessage>(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => value is S, thisArg?: any): S[];
        filter(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => unknown, thisArg?: any): CAIMessage[];
        reduce(callbackfn: (previousValue: CAIMessage, currentValue: CAIMessage, currentIndex: number, array: CAIMessage[]) => CAIMessage): CAIMessage;
        reduce(callbackfn: (previousValue: CAIMessage, currentValue: CAIMessage, currentIndex: number, array: CAIMessage[]) => CAIMessage, initialValue: CAIMessage): CAIMessage;
        reduce<U>(callbackfn: (previousValue: U, currentValue: CAIMessage, currentIndex: number, array: CAIMessage[]) => U, initialValue: U): U;
        reduceRight(callbackfn: (previousValue: CAIMessage, currentValue: CAIMessage, currentIndex: number, array: CAIMessage[]) => CAIMessage): CAIMessage;
        reduceRight(callbackfn: (previousValue: CAIMessage, currentValue: CAIMessage, currentIndex: number, array: CAIMessage[]) => CAIMessage, initialValue: CAIMessage): CAIMessage;
        reduceRight<U>(callbackfn: (previousValue: U, currentValue: CAIMessage, currentIndex: number, array: CAIMessage[]) => U, initialValue: U): U;
        find<S extends CAIMessage>(predicate: (value: CAIMessage, index: number, obj: CAIMessage[]) => value is S, thisArg?: any): S | undefined;
        find(predicate: (value: CAIMessage, index: number, obj: CAIMessage[]) => unknown, thisArg?: any): CAIMessage | undefined;
        findIndex(predicate: (value: CAIMessage, index: number, obj: CAIMessage[]) => unknown, thisArg?: any): number;
        fill(value: CAIMessage, start?: number, end?: number): CAIMessage[];
        copyWithin(target: number, start: number, end?: number): CAIMessage[];
        entries(): ArrayIterator<[number, CAIMessage]>;
        keys(): ArrayIterator<number>;
        values(): ArrayIterator<CAIMessage>;
        includes(searchElement: CAIMessage, fromIndex?: number): boolean;
        flatMap<U, This = undefined>(callback: (this: This, value: CAIMessage, index: number, array: CAIMessage[]) => U | readonly U[], thisArg?: This | undefined): U[];
        flat<A, D extends number = 1>(this: A, depth?: D | undefined): FlatArray<A, D>[];
        at(index: number): CAIMessage | undefined;
        findLast<S extends CAIMessage>(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => value is S, thisArg?: any): S | undefined;
        findLast(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => unknown, thisArg?: any): CAIMessage | undefined;
        findLastIndex(predicate: (value: CAIMessage, index: number, array: CAIMessage[]) => unknown, thisArg?: any): number;
        toReversed(): CAIMessage[];
        toSorted(compareFn?: ((a: CAIMessage, b: CAIMessage) => number) | undefined): CAIMessage[];
        toSpliced(start: number, deleteCount: number, ...items: CAIMessage[]): CAIMessage[];
        toSpliced(start: number, deleteCount?: number): CAIMessage[];
        with(index: number, value: CAIMessage): CAIMessage[];
        [Symbol.iterator](): ArrayIterator<CAIMessage>;
        [Symbol.unscopables]: {
            [x: number]: boolean | undefined;
            length?: boolean | undefined;
            toString?: boolean | undefined;
            toLocaleString?: boolean | undefined;
            pop?: boolean | undefined;
            push?: boolean | undefined;
            concat?: boolean | undefined;
            join?: boolean | undefined;
            reverse?: boolean | undefined;
            shift?: boolean | undefined;
            slice?: boolean | undefined;
            sort?: boolean | undefined;
            splice?: boolean | undefined;
            unshift?: boolean | undefined;
            indexOf?: boolean | undefined;
            lastIndexOf?: boolean | undefined;
            every?: boolean | undefined;
            some?: boolean | undefined;
            forEach?: boolean | undefined;
            map?: boolean | undefined;
            filter?: boolean | undefined;
            reduce?: boolean | undefined;
            reduceRight?: boolean | undefined;
            find?: boolean | undefined;
            findIndex?: boolean | undefined;
            fill?: boolean | undefined;
            copyWithin?: boolean | undefined;
            entries?: boolean | undefined;
            keys?: boolean | undefined;
            values?: boolean | undefined;
            includes?: boolean | undefined;
            flatMap?: boolean | undefined;
            flat?: boolean | undefined;
            at?: boolean | undefined;
            findLast?: boolean | undefined;
            findLastIndex?: boolean | undefined;
            toReversed?: boolean | undefined;
            toSorted?: boolean | undefined;
            toSpliced?: boolean | undefined;
            with?: boolean | undefined;
            [Symbol.iterator]?: boolean | undefined;
            readonly [Symbol.unscopables]?: boolean | undefined;
        };
    };
    private chat_id;
    get chatId(): string;
    set chatId(value: string);
    private create_time;
    get creationDate(): Date;
    private creator_id;
    get creatorId(): string;
    set creatorId(value: string);
    private character_id;
    get characterId(): string;
    protected set characterId(value: string);
    state: ConversationState;
    type: string;
    visibility: ConversationVisibility;
    getCharacter(): Promise<import("../index.js").Character>;
    getCreator(): Promise<undefined>;
    private preferred_model_type;
    get preferredModelType(): string;
    protected set preferredModelType(value: string);
    /**
     * Sets the model for this character.
     * **CAREFUL**: use `characterAI.getAvailableModels()` for the id
     */
    setPreferredModelType(modelId: string): Promise<void>;
    getLastMessage(): CAIMessage | null;
    protected frozen: boolean;
    private getTurnsBatch;
    protected addMessage(message: CAIMessage): CAIMessage;
    private fetchMessagesViaQuery;
    refreshMessages(): Promise<void>;
    sendMessage(_content: string, _options?: ICAIMessageSending): Promise<CAIMessage>;
    getPinnedMessages(): Promise<CAIMessage[]>;
    rename(_newName: string): Promise<void>;
    regenerateMessage(_message: CAIMessage): Promise<CAIMessage>;
    reset(): Promise<void>;
    private deleteTurns;
    deleteMessagesInBulk(input: number | string[] | CAIMessage[], refreshMessages?: boolean): Promise<void>;
    deleteMessageById(turnId: string, refreshMessages?: boolean): Promise<void>;
    deleteMessage(message: CAIMessage, refreshMessages?: boolean): Promise<void>;
    constructor(client: CharacterAI, information: any);
}
//# sourceMappingURL=conversation.d.ts.map