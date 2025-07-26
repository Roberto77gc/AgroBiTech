"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', validation_1.registerValidation, validation_1.handleValidationErrors, authController_1.register);
router.post('/login', validation_1.loginValidation, validation_1.handleValidationErrors, authController_1.login);
router.get('/profile', auth_1.authMiddleware, authController_1.getProfile);
router.get('/validate', auth_1.authMiddleware, authController_1.validateToken);
exports.default = router;
//# sourceMappingURL=auth.js.map