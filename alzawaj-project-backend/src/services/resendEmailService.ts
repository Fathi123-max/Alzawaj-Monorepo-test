/**
 * Email Service using Resend API
 * Replaces Gmail SMTP with Resend for better deliverability and analytics
 */
import { Resend } from "resend";
import getResendClient, {
  getDefaultSender,
  getDefaultSenderName,
  isResendConfigured,
} from "../config/resendConfig";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  text?: string;
}

/**
 * Send email using Resend API
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  // Get the resend client
  const resendClient = getResendClient();

  // Check if resend client is available
  if (!resendClient) {
    console.warn("Resend client not configured. Skipping email sending.");
    return false;
  }

  try {
    const from = options.from || getDefaultSender();
    const fromName = options.fromName || getDefaultSenderName();

    const emailData = {
      from: `${fromName} <${from}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || "",
    };

    const result = await resendClient.emails.send(emailData);

    if (result.error) {
      console.error("Resend API error:", result.error);
      return false;
    }

    console.log(`Email sent successfully with ID: ${result.data?.id}`);
    return true;
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    return false;
  }
};

/**
 * Send email verification
 */
export const sendEmailVerification = async (
  email: string,
  name: string,
  token: string
): Promise<boolean> => {
  try {
    console.log(`Sending email verification to ${email} with token ${token}`);

    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000";
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const emailOptions: EmailOptions = {
      to: email,
      subject: "تأكيد البريد الإلكتروني - منصة الزواج الإسلامية",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تأكيد البريد الإلكتروني</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #007bff; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .logo { 
              font-size: 24px; 
              font-weight: bold; 
              color: #007bff; 
              margin-bottom: 10px; 
            }
            .button { 
              display: inline-block; 
              background-color: #007bff; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #eee; 
              text-align: center; 
              color: #666; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">منصة الزواج الإسلامية</div>
              <p>مرحباً بك في موقعنا</p>
            </div>
            
            <h2>عزيزي/عزيزتي ${name}،</h2>
            
            <p>شكراً لتسجيلك في منصة الزواج الإسلامية. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">تأكيد البريد الإلكتروني</a>
            </div>
            
            <p>أو يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">${verificationLink}</p>
            
            <p><strong>ملاحظة:</strong> هذا الرابط صالح لمدة 24 ساعة فقط.</p>
            
            <div class="footer">
              <p>مع تحياتنا,<br>فريق منصة الزواج الإسلامية</p>
              <p>إذا لم تطلب هذا التأكيد، يرجى تجاهل هذا البريد الإلكتروني.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `عزيزي/عزيزتي ${name}،\n\nشكراً لتسجيلك في منصة الزواج الإسلامية. يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط التالي:\n\n${verificationLink}\n\nهذا الرابط صالح لمدة 24 ساعة فقط.\n\nمع تحياتنا،\nفريق منصة الزواج الإسلامية`,
    };

    return await sendEmail(emailOptions);
  } catch (error) {
    console.error("Error sending email verification:", error);
    return false;
  }
};

/**
 * Send email verification link
 */
export const sendEmailVerificationLink = async (
  email: string,
  name: string,
  link: string
): Promise<boolean> => {
  try {
    console.log(`Sending email verification to ${email} with link ${link}`);

    const emailOptions: EmailOptions = {
      to: email,
      subject: "تأكيد البريد الإلكتروني - منصة الزواج الإسلامية",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تأكيد البريد الإلكتروني</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background4f4f4;
              margin: 0;
-color: #f              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #007bff; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .logo { 
              font-size: 24px; 
              font-weight: bold; 
              color: #007bff; 
              margin-bottom: 10px; 
            }
            .button { 
              display: inline-block; 
              background-color: #007bff; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #eee; 
              text-align: center; 
              color: #666; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">منصة الزواج الإسلامية</div>
              <p>مرحباً بك في موقعنا</p>
            </div>
            
            <h2>عزيزي/عزيزتي ${name}،</h2>
            
            <p>شكراً لتسجيلك في منصة الزواج الإسلامية. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
            
            <div style="text-align: center;">
              <a href="${link}" class="button">تأكيد البريد الإلكتروني</a>
            </div>
            
            <p>أو يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">${link}</p>
            
            <p><strong>ملاحظة:</strong> هذا الرابط صالح لمدة 24 ساعة فقط.</p>
            
            <div class="footer">
              <p>مع تحياتنا,<br>فريق منصة الزواج الإسلامية</p>
              <p>إذا لم تطلب هذا التأكيد، يرجى تجاهل هذا البريد الإلكتروني.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `عزيزي/عزيزتي ${name}،\n\nشكراً لتسجيلك في منصة الزواج الإسلامية. يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط التالي:\n\n${link}\n\nهذا الرابط صالح لمدة 24 ساعة فقط.\n\nمع تحياتنا،\nفريق منصة الزواج الإسلامية`,
    };

    return await sendEmail(emailOptions);
  } catch (error) {
    console.error("Error sending email verification link:", error);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (
  email: string,
  name: string,
  token: string
): Promise<boolean> => {
  try {
    console.log(`Sending password reset to ${email} with token ${token}`);

    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const emailOptions: EmailOptions = {
      to: email,
      subject: "إعادة تعيين كلمة المرور - منصة الزواج الإسلامية",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>إعادة تعيين كلمة المرور</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #dc3545; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .logo { 
              font-size: 24px; 
              font-weight: bold; 
              color: #dc3545; 
              margin-bottom: 10px; 
            }
            .button { 
              display: inline-block; 
              background-color: #dc3545; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #eee; 
              text-align: center; 
              color: #666; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">منصة الزواج الإسلامية</div>
              <p>إعادة تعيين كلمة المرور</p>
            </div>
            
            <h2>عزيزي/عزيزتي ${name}،</h2>
            
            <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. يرجى النقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
            </div>
            
            <p>أو يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">${resetLink}</p>
            
            <p><strong>ملاحظة:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
            <p><strong>أمان:</strong> إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
            
            <div class="footer">
              <p>مع تحياتنا,<br>فريق منصة الزواج الإسلامية</p>
              <p>لأسباب أمنية، يرجى عدم مشاركة هذا الرابط مع أحد.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `عزيزي/عزيزتي ${name}،\n\nلقد طلبت إعادة تعيين كلمة المرور الخاصة بك. يرجى النقر على الرابط التالي:\n\n${resetLink}\n\nهذا الرابط صالح لمدة ساعة واحدة فقط.\n\nإذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.\n\nمع تحياتنا،\nفريق منصة الزواج الإسلامية`,
    };

    return await sendEmail(emailOptions);
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
  name: string
): Promise<Boolean> => {
  try {
    console.log(`Sending welcome email to ${email}`);

    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000";

    const emailOptions: EmailOptions = {
      to: email,
      subject: "مرحباً بك في منصة الزواج الإسلامية",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>مرحباً بك في منصة الزواج الإسلامية</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #28a745; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .logo { 
              font-size: 24px; 
              font-weight: bold; 
              color: #28a745; 
              margin-bottom: 10px; 
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #eee; 
              text-align: center; 
              color: #666; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">منصة الزواج الإسلامية</div>
              <p>مرحباً بك في موقعنا</p>
            </div>
            
            <h2>عزيزي/عزيزتي ${name}،</h2>
            
            <p>مرحباً بك في منصة الزواج الإسلامية! نحن سعداء لانضمامك إلينا.</p>
            
            <p>تم تفعيل حسابك بنجاح ويمكنك الآن:</p>
            <ul style="text-align: right; direction: rtl;">
              <li>إنشاء ملفك الشخصي بالتفاصيل التي تفضلها</li>
              <li>البحث عن شريك الحياة المناسب</li>
              <li>إرسال واستقبال طلبات الزواج</li>
              <li>التواصل مع المهتمين</li>
            </ul>
            
            <p>نتمنى لك تجربة موفقة في العثور على شريك الحياة المناسب.</p>
            
            <div class="footer">
              <p>مع تحياتنا,<br>فريق منصة الزواج الإسلامية</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `عزيزي/عزيزتي ${name}،

مرحباً بك في منصة الزواج الإسلامية! نحن سعداء لانضمامك إلينا.

تم تفعيل حسابك بنجاح ويمكنك الآن:

• إنشاء ملفك الشخصي بالتفاصيل التي تفضلها
• البحث عن شريك الحياة المناسب
• إرسال واستقبال طلبات الزواج
• التواصل مع المهتمين

نتمنى لك تجربة موفقة في العثور على شريك الحياة المناسب.

مع تحياتنا،
فريق منصة الزواج الإسلامية`,
    };

    return await sendEmail(emailOptions);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

export const emailService = {
  sendEmail,
  sendEmailVerification,
  sendEmailVerificationLink,
  sendPasswordReset,
  sendWelcomeEmail,
};

export default emailService;
