import { CharacterAI } from "../client.js";
export declare class PrivateProfile {
    protected client: CharacterAI;
    username: string;
    private id;
    get userId(): number;
    set userId(value: number);
    refreshProfile(): Promise<void>;
    loadFromInformation(information: any): void;
    constructor(client: CharacterAI);
}
//# sourceMappingURL=privateProfile.d.ts.map