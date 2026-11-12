declare class CharacterAIClient {
    private token;
    private client;
    private characterId;
    private dm;
    constructor(token: string);
    authenticate(): Promise<void>;
    sendMessage(message: string, image?: string | Buffer): Promise<string>;
}
export declare const characterAiClient: CharacterAIClient;
export {};
//# sourceMappingURL=testRunner.d.ts.map