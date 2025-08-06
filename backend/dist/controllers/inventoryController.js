"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAlertAsRead = exports.getAlerts = exports.adjustStock = exports.deleteInventoryItem = exports.updateInventoryItem = exports.createInventoryItem = exports.getInventoryItemById = exports.getInventoryItems = void 0;
const InventoryItem_1 = __importDefault(require("../models/InventoryItem"));
const InventoryAlert_1 = __importDefault(require("../models/InventoryAlert"));
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
        const { quantity, operation } = req.body;
        const item = await InventoryItem_1.default.findOne({ _id: id, userId, active: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' });
        }
        const newStock = operation === 'add'
            ? item.currentStock + quantity
            : item.currentStock - quantity;
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
//# sourceMappingURL=inventoryController.js.map