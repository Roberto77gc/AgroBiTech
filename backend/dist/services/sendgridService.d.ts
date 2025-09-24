export interface SendGridEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmailWithSendGrid: (options: SendGridEmailOptions) => Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
export default sendEmailWithSendGrid;
//# sourceMappingURL=sendgridService.d.ts.map