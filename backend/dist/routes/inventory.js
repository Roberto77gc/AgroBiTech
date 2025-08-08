"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const inventoryController_1 = require("../controllers/inventoryController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.get('/', inventoryController_1.getInventoryItems);
router.get('/alerts', inventoryController_1.getAlerts);
router.post('/alerts/:alertId/read', inventoryController_1.markAlertAsRead);
router.get('/product/:productId', inventoryController_1.getInventoryItemByProduct);
router.get('/:id', inventoryController_1.getInventoryItemById);
router.post('/', inventoryController_1.createInventoryItem);
router.put('/:id', inventoryController_1.updateInventoryItem);
router.delete('/:id', inventoryController_1.deleteInventoryItem);
router.post('/:id/adjust', inventoryController_1.adjustStock);
exports.default = router;
//# sourceMappingURL=inventory.js.map