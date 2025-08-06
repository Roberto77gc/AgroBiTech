import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

// Definir la interfaz AuthenticatedRequest localmente
interface AuthenticatedRequest extends Request {
	user?: {
		userId: string
		email: string
		name: string
	}
}

export const register = async (req: Request, res: Response) => {
	try {
		const { name, email, password } = req.body

		// Validaciones
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Todos los campos son requeridos' })
		}

		if (password.length < 6) {
			return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
		}

		// Verificar si el usuario ya existe
		const existingUser = await User.findOne({ email })
    if (existingUser) {
			return res.status(400).json({ message: 'El usuario ya existe' })
		}

		// Crear nuevo usuario
    const user = new User({
			name,
      email,
			password
		})

		await user.save()

		// Generar token
		const token = jwt.sign(
			{ userId: user._id, email: user.email },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '7d' }
		)

		return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email
			}
		})
  } catch (error) {
		console.error('Error in register:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body

		// Validaciones
		if (!email || !password) {
			return res.status(400).json({ message: 'Email y contraseña son requeridos' })
		}

		// Buscar usuario
		const user = await User.findOne({ email }).select('+password')
    if (!user) {
			return res.status(401).json({ message: 'Credenciales inválidas' })
		}

		// Verificar contraseña
		const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
			return res.status(401).json({ message: 'Credenciales inválidas' })
		}

		// Generar token
		const token = jwt.sign(
			{ userId: user._id, email: user.email },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '7d' }
		)

		return res.json({
      success: true,
			message: 'Login exitoso',
      token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email
			}
		})
	} catch (error) {
		console.error('Error in login:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			return res.status(401).json({ message: 'Usuario no autenticado' })
		}

		const user = await User.findById(userId).select('-password')
		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' })
		}

		return res.json({
			success: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email
			}
		})
  } catch (error) {
		console.error('Error getting profile:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			return res.status(401).json({ message: 'Usuario no autenticado' })
		}

		const { name, email } = req.body

		// Validaciones
		if (!name || !email) {
			return res.status(400).json({ message: 'Nombre y email son requeridos' })
		}

		// Verificar si el email ya está en uso por otro usuario
		const existingUser = await User.findOne({ email, _id: { $ne: userId } })
		if (existingUser) {
			return res.status(400).json({ message: 'El email ya está en uso' })
		}

		const user = await User.findByIdAndUpdate(
			userId,
			{ name, email },
			{ new: true }
		).select('-password')
    
    if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' })
		}

		return res.json({
      success: true,
			message: 'Perfil actualizado exitosamente',
			user: {
				id: user._id,
				name: user.name,
				email: user.email
			}
		})
	} catch (error) {
		console.error('Error updating profile:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			return res.status(401).json({ message: 'Usuario no autenticado' })
		}

		const { currentPassword, newPassword } = req.body

		// Validaciones
		if (!currentPassword || !newPassword) {
			return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas' })
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' })
		}

		// Buscar usuario con contraseña
		const user = await User.findById(userId).select('+password')
		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' })
		}

		// Verificar contraseña actual
		const isCurrentPasswordValid = await user.comparePassword(currentPassword)
		if (!isCurrentPasswordValid) {
			return res.status(401).json({ message: 'Contraseña actual incorrecta' })
		}

		// Actualizar contraseña
		user.password = newPassword
		await user.save()

		return res.json({
			success: true,
			message: 'Contraseña cambiada exitosamente'
		})
  } catch (error) {
		console.error('Error changing password:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			return res.status(401).json({ message: 'Usuario no autenticado' })
		}

		const { password } = req.body

		// Validaciones
		if (!password) {
			return res.status(400).json({ message: 'Contraseña es requerida para eliminar la cuenta' })
		}

		// Buscar usuario con contraseña
		const user = await User.findById(userId).select('+password')
    if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' })
		}

		// Verificar contraseña
		const isPasswordValid = await user.comparePassword(password)
		if (!isPasswordValid) {
			return res.status(401).json({ message: 'Contraseña incorrecta' })
		}

		// Eliminar usuario
		await User.findByIdAndDelete(userId)

		return res.json({
			success: true,
			message: 'Cuenta eliminada exitosamente'
		})
	} catch (error) {
		console.error('Error deleting account:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}

// Endpoint temporal para verificar usuarios existentes
export const checkUsers = async (_req: Request, res: Response) => {
	try {
		const users = await User.find({}, { password: 0 }) // Excluir contraseñas
		return res.json({
      success: true,
			users: users.map(user => ({
				id: user._id,
				name: user.name,
				email: user.email,
				createdAt: user.createdAt
			}))
		})
	} catch (error) {
		console.error('Error in checkUsers:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}

// Endpoint temporal para resetear contraseña
export const resetPassword = async (req: Request, res: Response) => {
	try {
		const { email, newPassword } = req.body

		if (!email || !newPassword) {
			return res.status(400).json({ message: 'Email y nueva contraseña son requeridos' })
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
		}

		const user = await User.findOne({ email }).select('+password')
		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' })
		}

		user.password = newPassword
		await user.save()

		return res.json({
			success: true,
			message: 'Contraseña reseteada exitosamente'
		})
  } catch (error) {
		console.error('Error in resetPassword:', error)
		return res.status(500).json({ message: 'Error interno del servidor' })
	}
}