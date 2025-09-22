/**
 * SendGrid Email Service for AgroBiTech
 * Professional email delivery service
 */

import sgMail from '@sendgrid/mail';

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface SendGridEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmailWithSendGrid = async (options: SendGridEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> => {
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
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: options.html,
    };

    console.log('📧 Enviando email con SendGrid a:', options.to);
    
    const response = await sgMail.send(msg);
    
    console.log('✅ Email enviado exitosamente con SendGrid:', {
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode
    });

    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };

  } catch (error: any) {
    console.error('❌ Error enviando email con SendGrid:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
};

export default sendEmailWithSendGrid;
