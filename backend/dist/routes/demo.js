"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const demoController_1 = require("../controllers/demoController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/auth/login', validation_1.loginValidation, validation_1.handleValidationErrors, demoController_1.demoLogin);
router.post('/auth/register', validation_1.registerValidation, validation_1.handleValidationErrors, demoController_1.demoRegister);
router.get('/auth/profile', demoController_1.demoGetProfile);
router.get('/auth/validate', demoController_1.demoValidateToken);
router.get('/dashboard', demoController_1.demoDashboardStats);
router.get('/dashboard/activities', demoController_1.demoActivities);
exports.default = router;
//# sourceMappingURL=demo.js.map