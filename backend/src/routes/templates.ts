import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/templateController'

const router = Router()

router.use(authMiddleware)

router.get('/', listTemplates)
router.post('/', createTemplate)
router.put('/:id', updateTemplate)
router.delete('/:id', deleteTemplate)

export default router


