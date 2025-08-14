"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.listTemplates = void 0;
const Template_1 = __importDefault(require("../models/Template"));
const listTemplates = async (req, res) => {
    try {
        const userId = req.user.userId;
        const type = req.query.type;
        const query = { userId };
        if (type)
            query.type = type;
        const templates = await Template_1.default.find(query).sort({ updatedAt: -1 });
        return res.json({ success: true, templates });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Error listando plantillas' });
    }
};
exports.listTemplates = listTemplates;
const createTemplate = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, type, payload } = req.body;
        const tpl = new Template_1.default({ userId, name, type, payload });
        await tpl.save();
        return res.status(201).json({ success: true, template: tpl });
    }
    catch (e) {
        if (e?.code === 11000) {
            return res.status(409).json({ success: false, message: 'Ya existe una plantilla con ese nombre y tipo' });
        }
        return res.status(500).json({ success: false, message: 'Error creando plantilla' });
    }
};
exports.createTemplate = createTemplate;
const updateTemplate = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, payload } = req.body;
        const tpl = await Template_1.default.findOneAndUpdate({ _id: id, userId }, { name, payload }, { new: true });
        if (!tpl)
            return res.status(404).json({ success: false, message: 'Plantilla no encontrada' });
        return res.json({ success: true, template: tpl });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Error actualizando plantilla' });
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const tpl = await Template_1.default.findOneAndDelete({ _id: id, userId });
        if (!tpl)
            return res.status(404).json({ success: false, message: 'Plantilla no encontrada' });
        return res.json({ success: true, message: 'Plantilla eliminada' });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Error eliminando plantilla' });
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=templateController.js.map