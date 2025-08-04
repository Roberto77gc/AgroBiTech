import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

interface JwtPayload {
	userId: string
	iat: number
	exp: number
	iss?: string
	aud?: string
}

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string
		email: string
		name: string
	}
}

export const authMiddleware = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Get token from header
		const authHeader = req.headers.authorization
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			res.status(401).json({
				success: false,
				message: 'Token no proporcionado o formato inválido'
			})
			return
		}

		const token = authHeader.substring(7) // Remove 'Bearer ' prefix

		if (!token) {
			res.status(401).json({
				success: false,
				message: 'Token no proporcionado'
			})
			return
		}

		// Verify token
		const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
		const decoded = jwt.verify(token, jwtSecret) as JwtPayload
		
		// Get user from database
		const user = await User.findById(decoded.userId)
		
		if (!user) {
			res.status(401).json({
				success: false,
				message: 'Usuario no encontrado'
			})
			return
		}

		// Add user info to request object
		req.user = {
			userId: user._id.toString(),
			email: user.email,
			name: user.name
		}
		
		next()

	} catch (error) {
		console.error('Auth middleware error:', error)
		
		if (error instanceof jwt.JsonWebTokenError) {
			res.status(401).json({
				success: false,
				message: 'Token inválido'
			})
			return
		}

		if (error instanceof jwt.TokenExpiredError) {
			res.status(401).json({
				success: false,
				message: 'Token expirado'
			})
			return
		}

		res.status(500).json({
			success: false,
			message: 'Error interno del servidor durante autenticación'
		})
	}
}

// Optional auth middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (
	req: AuthenticatedRequest,
	_res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return next()
		}

		const token = authHeader.substring(7)
		
		if (!token) {
			return next()
		}

		const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
		const decoded = jwt.verify(token, jwtSecret) as JwtPayload
		const user = await User.findById(decoded.userId)
		
		if (user) {
			req.user = {
				userId: user._id.toString(),
				email: user.email,
				name: user.name
			}
		}
		
		next()
	} catch (error) {
		// In optional auth, we don't fail on error, just continue without user
		next()
	}
}