import { Request, Response } from 'express'
import Template from '../models/Template'

export const listTemplates = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    if (!userId) {
      console.error('No userId found in request')
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' })
    }
    
    const type = req.query.type as string | undefined
    const query: any = { userId }
    if (type) query.type = type
    
    console.log('Querying templates with:', query)
    const templates = await Template.find(query).sort({ updatedAt: -1 })
    console.log('Found templates:', templates.length)
    
    return res.json({ success: true, templates })
  } catch (e) {
    console.error('Error in listTemplates:', e)
    return res.status(500).json({ success: false, message: 'Error listando plantillas' })
  }
}

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { name, type, payload } = req.body
    const tpl = new Template({ userId, name, type, payload })
    await tpl.save()
    return res.status(201).json({ success: true, template: tpl })
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ya existe una plantilla con ese nombre y tipo' })
    }
    return res.status(500).json({ success: false, message: 'Error creando plantilla' })
  }
}

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { id } = req.params
    const { name, payload } = req.body
    const tpl = await Template.findOneAndUpdate({ _id: id, userId }, { name, payload }, { new: true })
    if (!tpl) return res.status(404).json({ success: false, message: 'Plantilla no encontrada' })
    return res.json({ success: true, template: tpl })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error actualizando plantilla' })
  }
}

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { id } = req.params
    const tpl = await Template.findOneAndDelete({ _id: id, userId })
    if (!tpl) return res.status(404).json({ success: false, message: 'Plantilla no encontrada' })
    return res.json({ success: true, message: 'Plantilla eliminada' })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error eliminando plantilla' })
  }
}


