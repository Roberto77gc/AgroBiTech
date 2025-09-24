import nodemailer from 'nodemailer'

export interface SendEmailOptions {
	to: string
	subject: string
	html: string
	text?: string
}

let transporter: nodemailer.Transporter | null = null

const getTransporter = async (): Promise<nodemailer.Transporter> => {
	if (transporter) return transporter

	if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
		transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT ?? 587),
			secure: Number(process.env.SMTP_PORT ?? 587) === 465,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			},
			tls: {
				rejectUnauthorized: false
			}
		})
		
		// Verificar conexión SMTP
		transporter.verify((error, _success) => {
			if (error) {
				console.error('❌ SMTP connection error:', error)
			} else {
				console.log('✅ SMTP server is ready to take our messages')
			}
		})
		
		return transporter
	}

	// Fallback a cuenta de prueba Ethereal si no hay SMTP real
	const testAccount = await nodemailer.createTestAccount()
	transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false,
		auth: {
			user: testAccount.user,
			pass: testAccount.pass
		}
	})
	return transporter
}

export const sendEmail = async (options: SendEmailOptions): Promise<{ messageId: string; previewUrl?: string | undefined }> => {
	const transport = await getTransporter()
	const from = process.env.EMAIL_FROM || 'AgroBiTech <no-reply@agrobitech.local>'
	const info = await transport.sendMail({
		from,
		to: options.to,
		subject: options.subject,
		text: options.text,
		html: options.html
	})

	const previewUrl = nodemailer.getTestMessageUrl(info) || undefined
	const result: { messageId: string; previewUrl?: string | undefined } = {
		messageId: String(info.messageId)
	}
	if (previewUrl) result.previewUrl = previewUrl
	return result
}


