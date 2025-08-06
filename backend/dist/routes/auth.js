"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/check-users', authController_1.checkUsers);
router.post('/reset-password', authController_1.resetPassword);
router.get('/profile', auth_1.authMiddleware, authController_1.getProfile);
router.put('/profile', auth_1.authMiddleware, authController_1.updateProfile);
router.put('/password', auth_1.authMiddleware, authController_1.changePassword);
router.delete('/account', auth_1.authMiddleware, authController_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=auth.js.map