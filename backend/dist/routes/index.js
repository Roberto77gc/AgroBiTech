"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const dashboard_1 = __importDefault(require("./dashboard"));
const inventory_1 = __importDefault(require("./inventory"));
const products_1 = __importDefault(require("./products"));
const suppliers_1 = __importDefault(require("./suppliers"));
const purchases_1 = __importDefault(require("./purchases"));
const templates_1 = __importDefault(require("./templates"));
const router = express_1.default.Router();
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'AgroDigital API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
router.use('/auth', auth_1.default);
router.use('/dashboard', dashboard_1.default);
router.use('/inventory', inventory_1.default);
router.use('/products', products_1.default);
router.use('/suppliers', suppliers_1.default);
router.use('/purchases', purchases_1.default);
router.use('/templates', templates_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map