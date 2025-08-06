"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getSuppliers = void 0;
const Supplier_1 = __importDefault(require("../models/Supplier"));
const getSuppliers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const suppliers = await Supplier_1.default.find({ userId, active: true });
        return res.json({ success: true, suppliers });
    }
    catch (error) {
        console.error('Error getting suppliers:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getSuppliers = getSuppliers;
const getSupplierById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const supplier = await Supplier_1.default.findOne({ _id: id, userId, active: true });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }
        return res.json({ success: true, supplier });
    }
    catch (error) {
        console.error('Error getting supplier:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.getSupplierById = getSupplierById;
const createSupplier = async (req, res) => {
    try {
        const userId = req.user.userId;
        const supplierData = { ...req.body, userId };
        const supplier = new Supplier_1.default(supplierData);
        await supplier.save();
        return res.status(201).json({ success: true, supplier });
    }
    catch (error) {
        console.error('Error creating supplier:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const supplier = await Supplier_1.default.findOneAndUpdate({ _id: id, userId }, req.body, { new: true, runValidators: true });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }
        return res.json({ success: true, supplier });
    }
    catch (error) {
        console.error('Error updating supplier:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const supplier = await Supplier_1.default.findOneAndUpdate({ _id: id, userId }, { active: false }, { new: true });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }
        return res.json({ success: true, message: 'Proveedor eliminado correctamente' });
    }
    catch (error) {
        console.error('Error deleting supplier:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.deleteSupplier = deleteSupplier;
//# sourceMappingURL=supplierController.js.map