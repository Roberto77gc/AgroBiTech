"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLegacyInventory = exports.listMovements = exports.markAlertAsRead = exports.getAlerts = exports.adjustStock = exports.deleteInventoryItem = exports.updateInventoryItem = exports.createInventoryItem = exports.getInventoryItemByProduct = exports.getInventoryItemById = exports.getInventoryItems = void 0;
const InventoryItem_1 = __importDefault(require("../models/InventoryItem"));
const InventoryAlert_1 = __importDefault(require("../models/InventoryAlert"));
const ProductPrice_1 = __importDefault(require("../models/ProductPrice"));
const InventoryProduct_1 = __importDefault(require("../models/InventoryProduct"));
const inventoryService_1 = require("../services/inventoryService");
const InventoryMovement_1 = __importDefault(require("../models/InventoryMovement"));
const getInventoryItems = async (req, res) => {
    try {
        const userId = req.user.userId;
        const items = await InventoryItem_1.default.find({ userId, active: true });
        return res.json({ success: true, items });
    }
    catch (error) {
        console.error('Error getting inventory items:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getInventoryItems = getInventoryItems;
const getInventoryItemById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const item = await InventoryItem_1.default.findOne({ _id: id, userId, active: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' });
        }
        return res.json({ success: true, item });
    }
    catch (error) {
        console.error('Error getting inventory item:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getInventoryItemById = getInventoryItemById;
const getInventoryItemByProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;
        let item = await InventoryItem_1.default.findOne({ productId, userId, active: true });
        if (!item) {
            try {
                const product = await ProductPrice_1.default.findOne({ _id: productId, userId });
                if (product) {
                    const byName = await InventoryItem_1.default.findOne({ userId, productName: product.name, active: true });
                    if (byName) {
                        byName.productId = productId;
                        byName.productType = product.type;
                        byName.unit = byName.unit || product.unit || 'kg';
                        byName.lastUpdated = new Date();
                        await byName.save();
                        item = byName;
                    }
                    else {
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
                            item = migrated;
                        }
                    }
                }
            }
            catch (migrationError) {
                console.warn('No se pudo resolver inventario por nombre/migración:', migrationError.message);
            }
        }
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item de inventario no encontrado para este producto' });
        }
        return res.json({ success: true, item });
    }
    catch (error) {
        console.error('Error getting inventory item by product:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getInventoryItemByProduct = getInventoryItemByProduct;
const createInventoryItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const itemData = { ...req.body, userId };
        const item = new InventoryItem_1.default(itemData);
        await item.save();
        await checkInventoryAlerts(item);
        return res.status(201).json({ success: true, item });
    }
    catch (error) {
        console.error('Error creating inventory item:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.createInventoryItem = createInventoryItem;
const updateInventoryItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const item = await InventoryItem_1.default.findOneAndUpdate({ _id: id, userId }, { ...req.body, lastUpdated: new Date() }, { new: true, runValidators: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' });
        }
        await checkInventoryAlerts(item);
        return res.json({ success: true, item });
    }
    catch (error) {
        console.error('Error updating inventory item:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.updateInventoryItem = updateInventoryItem;
const deleteInventoryItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const item = await InventoryItem_1.default.findOneAndUpdate({ _id: id, userId }, { active: false }, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' });
        }
        return res.json({ success: true, message: 'Item de inventario eliminado correctamente' });
    }
    catch (error) {
        console.error('Error deleting inventory item:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.deleteInventoryItem = deleteInventoryItem;
const adjustStock = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { quantity, operation, unit } = req.body;
        const item = await InventoryItem_1.default.findOne({ _id: id, userId, active: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' });
        }
        const qtyInItemUnit = (0, inventoryService_1.convertAmount)(Number(quantity) || 0, unit || item.unit, item.unit);
        const newStock = operation === 'add'
            ? item.currentStock + qtyInItemUnit
            : item.currentStock - qtyInItemUnit;
        if (newStock < 0) {
            return res.status(400).json({ success: false, message: 'Stock no puede ser negativo' });
        }
        item.currentStock = newStock;
        item.lastUpdated = new Date();
        await item.save();
        await checkInventoryAlerts(item);
        return res.json({ success: true, item });
    }
    catch (error) {
        console.error('Error adjusting stock:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.adjustStock = adjustStock;
const getAlerts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const alerts = await InventoryAlert_1.default.find({ userId, read: false }).sort({ createdAt: -1 });
        return res.json({ success: true, alerts });
    }
    catch (error) {
        console.error('Error getting alerts:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getAlerts = getAlerts;
const markAlertAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { alertId } = req.params;
        const alert = await InventoryAlert_1.default.findOneAndUpdate({ _id: alertId, userId }, { read: true }, { new: true });
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
        }
        return res.json({ success: true, alert });
    }
    catch (error) {
        console.error('Error marking alert as read:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.markAlertAsRead = markAlertAsRead;
const listMovements = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, activityId, module, from, to, page = '1', limit = '20' } = req.query;
        const q = { userId };
        if (productId)
            q.productId = productId;
        if (activityId)
            q.activityId = activityId;
        if (module)
            q.module = module;
        if (from || to) {
            q.createdAt = {};
            if (from)
                q.createdAt.$gte = new Date(from);
            if (to)
                q.createdAt.$lte = new Date(to);
        }
        const pageNum = Math.max(parseInt(page || '1'), 1);
        const limitNum = Math.min(Math.max(parseInt(limit || '20'), 1), 100);
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            InventoryMovement_1.default.find(q).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            InventoryMovement_1.default.countDocuments(q)
        ]);
        return res.json({ success: true, items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
    }
    catch (e) {
        console.error('Error listing movements:', e);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.listMovements = listMovements;
const checkInventoryAlerts = async (item) => {
    try {
        await InventoryAlert_1.default.deleteMany({ itemId: item._id.toString() });
        if (item.currentStock <= item.criticalStock) {
            const criticalAlert = new InventoryAlert_1.default({
                userId: item.userId,
                itemId: item._id.toString(),
                productName: item.productName,
                type: 'critical_stock',
                message: `Stock crítico: ${item.productName} - Solo quedan ${item.currentStock} ${item.unit}`,
                severity: 'critical'
            });
            await criticalAlert.save();
        }
        else if (item.currentStock <= item.minStock) {
            const lowStockAlert = new InventoryAlert_1.default({
                userId: item.userId,
                itemId: item._id.toString(),
                productName: item.productName,
                type: 'low_stock',
                message: `Stock bajo: ${item.productName} - Quedan ${item.currentStock} ${item.unit}`,
                severity: 'warning'
            });
            await lowStockAlert.save();
        }
        if (item.expiryDate) {
            const expiryDate = new Date(item.expiryDate);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                const expiryAlert = new InventoryAlert_1.default({
                    userId: item.userId,
                    itemId: item._id.toString(),
                    productName: item.productName,
                    type: 'expiry_warning',
                    message: `Caducidad próxima: ${item.productName} - Caduca en ${daysUntilExpiry} días`,
                    severity: 'warning'
                });
                await expiryAlert.save();
            }
        }
    }
    catch (error) {
        console.error('Error checking inventory alerts:', error);
    }
};
const migrateLegacyInventory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const locationDefault = (req.body && req.body.location) || 'almacén';
        const prices = await ProductPrice_1.default.find({ userId, active: true }).lean();
        const nameToProduct = new Map();
        for (const p of prices) {
            nameToProduct.set(p.name, p);
        }
        const legacyItems = await InventoryProduct_1.default.find({ userId }).lean();
        const summary = {
            totalLegacy: legacyItems.length,
            migrated: 0,
            updated: 0,
            skippedNoProductMatch: 0,
            skippedAlreadyExists: 0,
            details: []
        };
        const categoryMap = {
            fertilizer: 'fertilizer',
            pesticide: 'phytosanitary',
            water: 'water',
        };
        for (const legacy of legacyItems) {
            const legacyName = legacy.name;
            const matched = nameToProduct.get(legacyName);
            if (!matched) {
                summary.skippedNoProductMatch++;
                summary.details.push({ name: legacyName, action: 'skip', reason: 'No hay ProductPrice con ese nombre' });
                continue;
            }
            const productId = String(matched._id);
            const existing = await InventoryItem_1.default.findOne({ userId, productId, active: true });
            const unit = legacy.unit || matched.unit || 'kg';
            const productType = (matched.type || categoryMap[legacy.category] || 'fertilizer');
            if (!existing) {
                const created = new InventoryItem_1.default({
                    userId,
                    productId,
                    productName: matched.name,
                    productType,
                    currentStock: legacy.quantity || 0,
                    minStock: legacy.minStock || 0,
                    criticalStock: Math.max(Math.floor((legacy.minStock || 0) / 2), 0),
                    unit,
                    location: locationDefault,
                    active: true,
                    lastUpdated: new Date(),
                });
                await created.save();
                summary.migrated++;
                summary.details.push({ name: legacyName, action: 'migrated' });
            }
            else {
                const nextMin = legacy.minStock ?? existing.minStock;
                const nextUnit = unit || existing.unit;
                if (nextMin !== existing.minStock || nextUnit !== existing.unit) {
                    existing.minStock = nextMin;
                    existing.unit = nextUnit;
                    existing.lastUpdated = new Date();
                    await existing.save();
                    summary.updated++;
                    summary.details.push({ name: legacyName, action: 'updated' });
                }
                else {
                    summary.skippedAlreadyExists++;
                    summary.details.push({ name: legacyName, action: 'skip', reason: 'Ya existía InventoryItem' });
                }
            }
        }
        return res.json({ success: true, summary });
    }
    catch (error) {
        console.error('Error migrating legacy inventory:', error);
        return res.status(500).json({ success: false, message: 'Error interno durante la migración' });
    }
};
exports.migrateLegacyInventory = migrateLegacyInventory;
//# sourceMappingURL=inventoryController.js.map