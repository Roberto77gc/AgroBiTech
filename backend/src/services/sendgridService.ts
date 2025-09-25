/**
 * SendGrid Email Service for AgroBiTech
 * Professional email delivery service
 */

import sgMail from '@sendgrid/mail';

// SendGrid will be configured dynamically in each function call

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

    // Configure SendGrid API key dynamically
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: options.to,
      from: 'contacto@agrobitech.com', // Simplified format
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: options.html,
    };

    console.log('📧 Enviando email con SendGrid a:', options.to);
    console.log('🔑 API Key configurada:', process.env.SENDGRID_API_KEY ? 'SÍ' : 'NO');
    
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
