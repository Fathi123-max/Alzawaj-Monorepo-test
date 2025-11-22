/**
 * Email Service for sending various types of emails
 */

import axios from 'axios';
import transporter from '../config/emailConfig';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

// Define the mailboxlayer API response type
interface MailboxlayerResponse {
  email: string;
  did_you_mean?: string;
  user: string;
  domain: string;
  format_valid: boolean;
  mx_found: boolean;
  smtp_check: boolean;
  catch_all: boolean;
  role: boolean;
  disposable: boolean;
  free: boolean;
  score: number;
}

interface MailboxlayerErrorResponse {
  success: false;
  error: {
    code: number;
    type: string;
    info: string;
  };
}

type MailboxlayerResult = MailboxlayerResponse | MailboxlayerErrorResponse;

function isErrorResponse(result: MailboxlayerResult): result is MailboxlayerErrorResponse {
  return !!(result as MailboxlayerErrorResponse).error;
}

/**
 * Validate email using mailboxlayer API
 */
export const validateEmail = async (email: string): Promise<{ isValid: boolean; suggestion?: string; details?: MailboxlayerResponse }> => {
  try {
    const accessKey = process.env.MAILBOXLAYER_API_KEY;

    if (!accessKey) {
      console.error('Mailboxlayer API key not configured');
      return { isValid: true, details: undefined }; // Allow validation to proceed if API key is not configured
    }

    // Make the API call with a timeout
    const response = await axios.get<MailboxlayerResult>(
      `https://apilayer.net/api/check?access_key=${accessKey}&email=${encodeURIComponent(email)}`,
      { timeout: 10000 } // 10 second timeout
    );

    const data = response.data;

    if (isErrorResponse(data)) {
      console.error(`Mailboxlayer API error: ${data.error.type} - ${data.error.info}`);
      return { isValid: true, details: undefined }; // Allow to proceed if API returns error
    }

    // Consider an email valid if format is valid and it passes SMTP check (if enabled)
    // We can customize this logic based on our requirements
    const isValid = data.format_valid;
    const suggestion = data.did_you_mean ? data.did_you_mean : undefined;

    return {
      isValid,
      suggestion,
      details: {
        ...data
      }
    };
  } catch (error) {
    console.error('Error validating email with mailboxlayer API:', error);
    // If there's an error with the API (timeout, network issue, etc), allow the email to proceed
    return { isValid: true, details: undefined };
  }
};

/**
 * Send email verification
 */
export const sendEmailVerification = async (
  email: string,
  name: string,
  token: string,
): Promise<boolean> => {
  try {
    // Validate the email address first
    const validation = await validateEmail(email);
    if (!validation.isValid) {
      console.error(`Invalid email address: ${email}`);
      if (validation.suggestion) {
        console.log(`Did you mean: ${validation.suggestion}?`);
      }
      return false;
    }

    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email verification to ${email} with token ${token}`);

    const emailOptions: EmailOptions = {
      to: email,
      subject: "تأكيد البريد الإلكتروني - منصة الزواج الإسلامية",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2>مرحباً ${name}</h2>
          <p>شكراً لتسجيلك في منصة الزواج الإسلامية. يرجى النقر على الرابط أدناه لتأكيد بريدك الإلكتروني:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}"
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            تأكيد البريد الإلكتروني
          </a>
          <p>إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد.</p>
        </div>
      `,
    };

    // Send the email using nodemailer transporter
    const info = await transporter.sendMail(emailOptions);
    console.log(`Verification email sent: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error("Error sending email verification:", error);
    return false;
}}



export const sendEmailVerificationLink = async (
  email: string,
  name: string,
  link: string,
): Promise<boolean> => {
  try {
    // Validate the email address first
    const validation = await validateEmail(email);
    if (!validation.isValid) {
      console.error(`Invalid email address: ${email}`);
      if (validation.suggestion) {
        console.log(`Did you mean: ${validation.suggestion}?`);
      }
      return false;
    }

    console.log(`Sending email verification to ${email} with link ${link}`);

    const emailOptions: EmailOptions = {
      to: email,
      subject: "تأكيد البريد الإلكتروني - منصة الزواج الإسلامية",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2>مرحباً ${name}</h2>
          <p>شكراً لتسجيلك في منصة الزواج الإسلامية. يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني:</p>
          <a href="${link}"
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            تأكيد البريد الإلكتروني
          </a>
          <p>إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد.</p>
        </div>
      `,
    };

    // Send the email using nodemailer transporter
    const info = await transporter.sendMail(emailOptions);
    console.log(`Verification email sent: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error("Error sending email verification link:", error);
    return false;
  }
};


export const sendPasswordReset = async (
  email: string,
  name: string,
  token: string,
): Promise<boolean> => {
  try {
    // Validate the email address first
    const validation = await validateEmail(email);
    if (!validation.isValid) {
      console.error(`Invalid email address: ${email}`);
      if (validation.suggestion) {
        console.log(`Did you mean: ${validation.suggestion}?`);
      }
      return false;
    }

    console.log(`Sending password reset to ${email} with token ${token}`);

    const emailOptions: EmailOptions = {
      to: email,
      subject: "إعادة تعيين كلمة المرور - منصة الزواج الإسلامية",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2>مرحباً ${name}</h2>
          <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. يرجى النقر على الرابط أدناه لإعادة تعيين كلمة المرور:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}"
             style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            إعادة تعيين كلمة المرور
          </a>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
          <p>ينتهي صلاحية هذا الرابط خلال ساعة واحدة.</p>
        </div>
      `,
    };

    // Send the email using nodemailer transporter
    const info = await transporter.sendMail(emailOptions);
    console.log(`Password reset email sent: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
): Promise<boolean> => {
  try {
    // Validate the email address first
    const validation = await validateEmail(email);
    if (!validation.isValid) {
      console.error(`Invalid email address: ${email}`);
      if (validation.suggestion) {
        console.log(`Did you mean: ${validation.suggestion}?`);
      }
      return false;
    }

    console.log(`Sending welcome email to ${email}`);

    const emailOptions: EmailOptions = {
      to: email,
      subject: "مرحباً بك في منصة الزواج الإسلامية",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2>مرحباً بك ${name}</h2>
          <p>نحن سعداء لانضمامك إلى منصة الزواج الإسلامية. تم تفعيل حسابك بنجاح.</p>
          <p>يمكنك الآن:</p>
          <ul>
            <li>إنشاء ملفك الشخصي</li>
            <li>البحث عن شريك الحياة المناسب</li>
            <li>إرسال طلبات الزواج</li>
          </ul>
          <p>نتمنى لك تجربة موفقة في العثور على شريك الحياة المناسب.</p>
        </div>
      `,
    };

    // Send the email using nodemailer transporter
    const info = await transporter.sendMail(emailOptions);
    console.log(`Welcome email sent: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

/**
 * Send marriage request notification
 */
export const sendMarriageRequestNotification = async (
  email: string,
  recipientName: string,
  senderName: string,
): Promise<boolean> => {
  try {
    // Validate the email address first
    const validation = await validateEmail(email);
    if (!validation.isValid) {
      console.error(`Invalid email address: ${email}`);
      if (validation.suggestion) {
        console.log(`Did you mean: ${validation.suggestion}?`);
      }
      return false;
    }

    console.log(`Sending marriage request notification to ${email}`);

    const emailOptions: EmailOptions = {
      to: email,
      subject: "طلب زواج جديد - منصة الزواج الإسلامية",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2>مرحباً ${recipientName}</h2>
          <p>تلقيت طلب زواج جديد من ${senderName}.</p>
          <p>يرجى تسجيل الدخول إلى حسابك لمراجعة الطلب والرد عليه.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/requests"
             style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            مراجعة الطلب
          </a>
        </div>
      `,
    };

    // Send the email using nodemailer transporter
    const info = await transporter.sendMail(emailOptions);
    console.log(`Marriage request notification sent: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error("Error sending marriage request notification:", error);
    return false;
  }
};

export default {
  sendEmailVerification,
  sendEmailVerificationLink,
  sendPasswordReset,
  sendWelcomeEmail,
  sendMarriageRequestNotification,
  validateEmail,
};
