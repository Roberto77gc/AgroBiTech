"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const templateController_1 = require("../controllers/templateController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/', templateController_1.listTemplates);
router.post('/', templateController_1.createTemplate);
router.put('/:id', templateController_1.updateTemplate);
router.delete('/:id', templateController_1.deleteTemplate);
exports.default = router;
//# sourceMappingURL=templates.js.map