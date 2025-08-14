"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryByProducts = void 0;
const InventoryItem_1 = __importDefault(require("../models/InventoryItem"));
const getInventoryByProducts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const idsParam = req.query.ids || '';
        const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
        if (!userId || ids.length === 0)
            return res.json({ success: true, items: [] });
        const items = await InventoryItem_1.default.find({ userId, productId: { $in: ids }, active: true }).lean();
        const map = {};
        for (const it of items) {
            map[it.productId] = { _id: String(it._id), productId: it.productId, currentStock: it.currentStock, unit: it.unit };
        }
        return res.json({ success: true, items: map });
    }
    catch (e) {
        console.error('Error in getInventoryByProducts:', e);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getInventoryByProducts = getInventoryByProducts;
//# sourceMappingURL=inventoryBatchEndpoint.js.map