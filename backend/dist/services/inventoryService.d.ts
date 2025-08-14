import mongoose from 'mongoose';
export type Unit = 'kg' | 'g' | 'L' | 'ml' | 'm3';
export declare const normalizeUnit: (u?: string) => Unit | undefined;
export declare const convertAmount: (amount: number, fromUnit?: string, toUnit?: string) => number;
export declare const resolveInventoryItemByProduct: (userId: string, productId: string) => Promise<(mongoose.Document<unknown, {}, import("../models/InventoryItem").IInventoryItem, {}> & import("../models/InventoryItem").IInventoryItem & Required<{
    _id: unknown;
}> & {
    __v: number;
}) | null>;
export declare const adjustStockAtomically: (userId: string, operations: Array<{
    productId: string;
    amount: number;
    amountUnit?: string;
    reason?: string;
    operation?: "add" | "subtract";
    context?: {
        activityId?: string;
        module?: "fertigation" | "phytosanitary" | "water";
        dayIndex?: number;
    };
}>) => Promise<{
    ok: boolean;
    error?: string;
    details?: Array<{
        productId: string;
        available?: number;
        requested: number;
        unit: string;
    }>;
    balances?: Record<string, number>;
}>;
//# sourceMappingURL=inventoryService.d.ts.map