"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePurchase = exports.updatePurchase = exports.createPurchase = exports.getPurchasesBySupplier = exports.getPurchasesByProduct = exports.getPurchases = void 0;
const ProductPurchase_1 = __importDefault(require("../models/ProductPurchase"));
const getPurchases = async (req, res) => {
    try {
        const userId = req.user.userId;
        const purchases = await ProductPurchase_1.default.find({ userId }).sort({ purchaseDate: -1 });
        return res.json({ success: true, purchases });
    }
    catch (error) {
        console.error('Error getting purchases:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getPurchases = getPurchases;
const getPurchasesByProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;
        const purchases = await ProductPurchase_1.default.find({ userId, productId }).sort({ purchaseDate: -1 });
        return res.json({ success: true, purchases });
    }
    catch (error) {
        console.error('Error getting purchases by product:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getPurchasesByProduct = getPurchasesByProduct;
const getPurchasesBySupplier = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { supplier } = req.params;
        const purchases = await ProductPurchase_1.default.find({ userId, supplier }).sort({ purchaseDate: -1 });
        return res.json({ success: true, purchases });
    }
    catch (error) {
        console.error('Error getting purchases by supplier:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getPurchasesBySupplier = getPurchasesBySupplier;
const createPurchase = async (req, res) => {
    try {
        const userId = req.user.userId;
        const purchaseData = { ...req.body, userId };
        const purchase = new ProductPurchase_1.default(purchaseData);
        await purchase.save();
        return res.status(201).json({ success: true, purchase });
    }
    catch (error) {
        console.error('Error creating purchase:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.createPurchase = createPurchase;
const updatePurchase = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const purchase = await ProductPurchase_1.default.findOneAndUpdate({ _id: id, userId }, req.body, { new: true, runValidators: true });
        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Compra no encontrada' });
        }
        return res.json({ success: true, purchase });
    }
    catch (error) {
        console.error('Error updating purchase:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.updatePurchase = updatePurchase;
const deletePurchase = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const purchase = await ProductPurchase_1.default.findOneAndDelete({ _id: id, userId });
        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Compra no encontrada' });
        }
        return res.json({ success: true, message: 'Compra eliminada correctamente' });
    }
    catch (error) {
        console.error('Error deleting purchase:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.deletePurchase = deletePurchase;
//# sourceMappingURL=purchaseController.js.map