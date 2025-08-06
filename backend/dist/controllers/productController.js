"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductsByType = exports.getProducts = void 0;
const ProductPrice_1 = __importDefault(require("../models/ProductPrice"));
const getProducts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const products = await ProductPrice_1.default.find({ userId, active: true });
        return res.json({ success: true, products });
    }
    catch (error) {
        console.error('Error getting products:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getProducts = getProducts;
const getProductsByType = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type } = req.params;
        if (!['fertilizer', 'water', 'phytosanitary'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Tipo de producto inválido' });
        }
        const products = await ProductPrice_1.default.find({ userId, type, active: true });
        return res.json({ success: true, products });
    }
    catch (error) {
        console.error('Error getting products by type:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getProductsByType = getProductsByType;
const createProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const productData = { ...req.body, userId };
        const product = new ProductPrice_1.default(productData);
        await product.save();
        return res.status(201).json({ success: true, product });
    }
    catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const product = await ProductPrice_1.default.findOneAndUpdate({ _id: id, userId }, req.body, { new: true, runValidators: true });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        return res.json({ success: true, product });
    }
    catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const product = await ProductPrice_1.default.findOneAndUpdate({ _id: id, userId }, { active: false }, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        return res.json({ success: true, message: 'Producto eliminado correctamente' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map