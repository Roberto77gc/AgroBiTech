"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/', dashboardController_1.getDashboardStats);
router.get('/activities', dashboardController_1.getActivitiesSummary);
exports.default = router;
//# sourceMappingURL=dashboard.js.map