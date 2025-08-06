"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const dashboardController_1 = require("../controllers/dashboardController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.get('/stats', dashboardController_1.getDashboardStats);
router.get('/advanced', dashboardController_1.getAdvancedDashboard);
router.get('/activities', dashboardController_1.getActivities);
router.post('/activities', dashboardController_1.createActivity);
router.put('/activities/:id', dashboardController_1.updateActivity);
router.delete('/activities/:id', dashboardController_1.deleteActivity);
router.get('/activities/:id', dashboardController_1.getActivityById);
router.get('/', dashboardController_1.getDashboardStats);
router.get('/activities', dashboardController_1.getActivities);
exports.default = router;
//# sourceMappingURL=dashboard.js.map