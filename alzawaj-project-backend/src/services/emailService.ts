/**
 * Email Service for sending various types of emails
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send email verification
 */
export const sendEmailVerification = async (
  email: string,
  name: string,
  token: string,
): Promise<boolean> => {
  try {
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

    // Here you would call your actual email service
    // await emailProvider.send(emailOptions);

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

    // Integrate with actual email provider here
    // await emailProvider.send(emailOptions);

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

    // Here you would call your actual email service
    // await emailProvider.send(emailOptions);

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

    // Here you would call your actual email service
    // await emailProvider.send(emailOptions);

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

    // Here you would call your actual email service
    // await emailProvider.send(emailOptions);

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
};
