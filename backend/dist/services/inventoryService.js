"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustStockAtomically = exports.resolveInventoryItemByProduct = exports.convertAmount = exports.normalizeUnit = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const InventoryItem_1 = __importDefault(require("../models/InventoryItem"));
const ProductPrice_1 = __importDefault(require("../models/ProductPrice"));
const InventoryProduct_1 = __importDefault(require("../models/InventoryProduct"));
const InventoryMovement_1 = __importDefault(require("../models/InventoryMovement"));
const normalizeUnit = (u) => {
    if (!u)
        return undefined;
    const t = u.trim().toLowerCase();
    if (['kg', 'kilogramo', 'kilogramos'].includes(t))
        return 'kg';
    if (['g', 'gramo', 'gramos'].includes(t))
        return 'g';
    if (['l', 'litro', 'litros'].includes(t))
        return 'L';
    if (['ml', 'mililitro', 'mililitros'].includes(t))
        return 'ml';
    if (['m3', 'm^3', 'metro cubico', 'metros cubicos'].includes(t))
        return 'm3';
    return t;
};
exports.normalizeUnit = normalizeUnit;
const unitGroup = (u) => {
    if (!u)
        return 'other';
    return (u === 'kg' || u === 'g') ? 'mass'
        : (u === 'L' || u === 'ml' || u === 'm3') ? 'volume'
            : 'other';
};
const convertAmount = (amount, fromUnit, toUnit) => {
    const fromU = (0, exports.normalizeUnit)(fromUnit);
    const toU = (0, exports.normalizeUnit)(toUnit);
    if (!fromU || !toU || fromU === toU)
        return amount;
    const fromG = unitGroup(fromU);
    const toG = unitGroup(toU);
    if (fromG !== toG) {
        return amount;
    }
    if (fromG === 'mass') {
        const inGrams = fromU === 'kg' ? amount * 1000 : amount;
        return toU === 'kg' ? inGrams / 1000 : inGrams;
    }
    let inMl = amount;
    if (fromU === 'L')
        inMl = amount * 1000;
    if (fromU === 'm3')
        inMl = amount * 1000000;
    if (toU === 'L')
        return inMl / 1000;
    if (toU === 'm3')
        return inMl / 1000000;
    return inMl;
};
exports.convertAmount = convertAmount;
const resolveInventoryItemByProduct = async (userId, productId) => {
    let item = await InventoryItem_1.default.findOne({ userId, productId, active: true });
    if (item)
        return item;
    try {
        const product = await ProductPrice_1.default.findOne({ _id: productId, userId });
        if (!product)
            return null;
        const byName = await InventoryItem_1.default.findOne({ userId, productName: product.name, active: true });
        if (byName) {
            byName.productId = productId;
            byName.productType = product.type;
            byName.unit = byName.unit || product.unit || 'kg';
            byName.lastUpdated = new Date();
            await byName.save();
            return byName;
        }
        const legacy = await InventoryProduct_1.default.findOne({ userId, name: product.name });
        if (legacy) {
            const migrated = new InventoryItem_1.default({
                userId,
                productId,
                productName: product.name,
                productType: product.type,
                currentStock: legacy.quantity || 0,
                minStock: legacy.minStock || 0,
                criticalStock: Math.max(Math.floor((legacy.minStock || 0) / 2), 0),
                unit: legacy.unit || product.unit || 'kg',
                location: 'almacén',
                active: true,
                lastUpdated: new Date()
            });
            await migrated.save();
            return migrated;
        }
    }
    catch (e) {
    }
    return null;
};
exports.resolveInventoryItemByProduct = resolveInventoryItemByProduct;
const adjustStockAtomically = async (userId, operations) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const details = [];
        const balances = {};
        const resolved = {};
        for (const op of operations) {
            const item = await (0, exports.resolveInventoryItemByProduct)(userId, op.productId);
            if (!item) {
                details.push({ productId: op.productId, requested: op.amount, unit: (0, exports.normalizeUnit)(op.amountUnit) || 'kg' });
                await session.abortTransaction();
                session.endSession();
                return { ok: false, error: 'inventory_item_not_found', details };
            }
            resolved[op.productId] = item;
        }
        const addOps = operations.filter(op => (op.operation || 'subtract') === 'add');
        const subOps = operations.filter(op => (op.operation || 'subtract') === 'subtract');
        const process = async (op) => {
            const item = resolved[op.productId];
            const requestInItemUnit = (0, exports.convertAmount)(op.amount, op.amountUnit || item.unit, item.unit);
            if ((op.operation || 'subtract') === 'add') {
                const updated = await InventoryItem_1.default.findOneAndUpdate({ _id: item._id, userId, active: true }, { $inc: { currentStock: requestInItemUnit }, $set: { lastUpdated: new Date() } }, { new: true, session });
                balances[op.productId] = updated.currentStock;
                await InventoryMovement_1.default.create([{
                        userId,
                        inventoryItemId: updated._id,
                        productId: item.productId,
                        productName: item.productName,
                        operation: 'add',
                        amount: op.amount,
                        unit: op.amountUnit || item.unit,
                        amountInItemUnit: requestInItemUnit,
                        balanceAfter: updated.currentStock,
                        reason: op.reason,
                        activityId: op.context?.activityId,
                        module: op.context?.module,
                        dayIndex: op.context?.dayIndex,
                    }], { session });
                return { ok: true };
            }
            else {
                const updated = await InventoryItem_1.default.findOneAndUpdate({ _id: item._id, userId, active: true, currentStock: { $gte: requestInItemUnit } }, { $inc: { currentStock: -requestInItemUnit }, $set: { lastUpdated: new Date() } }, { new: true, session });
                if (!updated) {
                    details.push({ productId: op.productId, available: item.currentStock, requested: requestInItemUnit, unit: item.unit });
                    return { ok: false };
                }
                balances[op.productId] = updated.currentStock;
                await InventoryMovement_1.default.create([{
                        userId,
                        inventoryItemId: updated._id,
                        productId: item.productId,
                        productName: item.productName,
                        operation: 'subtract',
                        amount: op.amount,
                        unit: op.amountUnit || item.unit,
                        amountInItemUnit: requestInItemUnit,
                        balanceAfter: updated.currentStock,
                        reason: op.reason,
                        activityId: op.context?.activityId,
                        module: op.context?.module,
                        dayIndex: op.context?.dayIndex,
                    }], { session });
                return { ok: true };
            }
        };
        for (const op of addOps) {
            const r = await process(op);
            if (!r.ok) {
                await session.abortTransaction();
                session.endSession();
                return { ok: false, error: 'insufficient_stock', details };
            }
        }
        for (const op of subOps) {
            const r = await process(op);
            if (!r.ok) {
                await session.abortTransaction();
                session.endSession();
                return { ok: false, error: 'insufficient_stock', details };
            }
        }
        await session.commitTransaction();
        session.endSession();
        return { ok: true, balances };
    }
    catch (e) {
        await session.abortTransaction();
        session.endSession();
        return { ok: false, error: 'transaction_failed' };
    }
};
exports.adjustStockAtomically = adjustStockAtomically;
//# sourceMappingURL=inventoryService.js.map