import { CharacterAI } from "../client.js";
export default class ObjectPatcher {
    static patch(client: CharacterAI, instance: any, object: Record<string, any>): void;
    static clean(object: Record<string, any>): Record<string, any>;
}
//# sourceMappingURL=patcher.d.ts.map