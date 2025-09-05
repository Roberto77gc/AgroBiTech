export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmail: (options: SendEmailOptions) => Promise<{
    messageId: string;
    previewUrl?: string | undefined;
}>;
//# sourceMappingURL=emailService.d.ts.map