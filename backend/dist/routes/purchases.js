"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const purchaseController_1 = require("../controllers/purchaseController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.get('/', purchaseController_1.getPurchases);
router.get('/product/:productId', purchaseController_1.getPurchasesByProduct);
router.get('/supplier/:supplier', purchaseController_1.getPurchasesBySupplier);
router.post('/', purchaseController_1.createPurchase);
router.put('/:id', purchaseController_1.updatePurchase);
router.delete('/:id', purchaseController_1.deletePurchase);
exports.default = router;
//# sourceMappingURL=purchases.js.map