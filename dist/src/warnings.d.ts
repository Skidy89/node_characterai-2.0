declare const warnings: Record<"reachedMaxMessages" | "sendingFrozen" | "deletingInBulk" | "contentFiltered" | "soxNotFound", WarningEntry>;
interface WarningEntry {
    message: string;
    hasShown: boolean;
    useWarning: boolean;
}
type WarningNames = keyof typeof warnings;
export default class Warnings {
    static disabled: boolean;
    static show(name: WarningNames): void;
    static disable(): void;
    static enable(): void;
}
export {};
//# sourceMappingURL=warnings.d.ts.map