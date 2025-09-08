"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = null;
const getTransporter = async () => {
    if (transporter)
        return transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: Number(process.env.SMTP_PORT ?? 587) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        return transporter;
    }
    const testAccount = await nodemailer_1.default.createTestAccount();
    transporter = nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
    return transporter;
};
const sendEmail = async (options) => {
    const transport = await getTransporter();
    const from = process.env.EMAIL_FROM || 'AgroBiTech <no-reply@agrobitech.local>';
    const info = await transport.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    });
    const previewUrl = nodemailer_1.default.getTestMessageUrl(info) || undefined;
    const result = {
        messageId: String(info.messageId)
    };
    if (previewUrl)
        result.previewUrl = previewUrl;
    return result;
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=emailService.js.map