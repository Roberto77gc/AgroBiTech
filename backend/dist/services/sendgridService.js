"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailWithSendGrid = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
if (process.env.SENDGRID_API_KEY) {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
}
const sendEmailWithSendGrid = async (options) => {
    try {
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY not configured');
        }
        const msg = {
            to: options.to,
            from: {
                email: 'contacto@agrobitech.com',
                name: 'AgroBiTech'
            },
            subject: options.subject,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
            html: options.html,
        };
        console.log('📧 Enviando email con SendGrid a:', options.to);
        const response = await mail_1.default.send(msg);
        console.log('✅ Email enviado exitosamente con SendGrid:', {
            messageId: response[0].headers['x-message-id'],
            statusCode: response[0].statusCode
        });
        return {
            success: true,
            messageId: response[0].headers['x-message-id']
        };
    }
    catch (error) {
        console.error('❌ Error enviando email con SendGrid:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
};
exports.sendEmailWithSendGrid = sendEmailWithSendGrid;
exports.default = exports.sendEmailWithSendGrid;
//# sourceMappingURL=sendgridService.js.map