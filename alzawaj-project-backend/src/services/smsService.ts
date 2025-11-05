/**
 * SMS Service for sending SMS notifications
 */

export interface SMSOptions {
  to: string;
  message: string;
}

/**
 * Send phone verification OTP
 */
export const sendPhoneVerificationOTP = async (
  phoneNumber: string,
  otp: string,
): Promise<boolean> => {
  try {
    // This would integrate with your SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending OTP ${otp} to ${phoneNumber}`);

    const message = `كود التحقق الخاص بك هو: ${otp}. صالح لمدة 10 دقائق. منصة الزواج الإسلامية`;

    const smsOptions: SMSOptions = {
      to: phoneNumber,
      message,
    };

    // Here you would call your actual SMS service
    // await smsProvider.send(smsOptions);

    return true;
  } catch (error) {
    console.error("Error sending phone verification OTP:", error);
    return false;
  }
};

/**
 * Send marriage request SMS notification
 */
export const sendMarriageRequestSMS = async (
  phoneNumber: string,
  recipientName: string,
  senderName: string,
): Promise<boolean> => {
  try {
    console.log(`Sending marriage request SMS to ${phoneNumber}`);

    const message = `مرحباً ${recipientName}، تلقيت طلب زواج جديد من ${senderName}. يرجى تسجيل الدخول لمراجعة الطلب.`;

    const smsOptions: SMSOptions = {
      to: phoneNumber,
      message,
    };

    // Here you would call your actual SMS service
    // await smsProvider.send(smsOptions);

    return true;
  } catch (error) {
    console.error("Error sending marriage request SMS:", error);
    return false;
  }
};

/**
 * Send account security alert
 */
export const sendSecurityAlert = async (
  phoneNumber: string,
  alertType: "login" | "password_change" | "account_locked",
): Promise<boolean> => {
  try {
    console.log(`Sending security alert SMS to ${phoneNumber}`);

    let message = "";
    switch (alertType) {
      case "login":
        message =
          "تم تسجيل دخول جديد إلى حسابك. إذا لم تكن أنت، يرجى تغيير كلمة المرور فوراً.";
        break;
      case "password_change":
        message = "تم تغيير كلمة المرور الخاصة بحسابك بنجاح.";
        break;
      case "account_locked":
        message =
          "تم قفل حسابك مؤقتاً بسبب محاولات دخول متكررة. يرجى المحاولة بعد 15 دقيقة.";
        break;
    }

    const smsOptions: SMSOptions = {
      to: phoneNumber,
      message,
    };

    // Here you would call your actual SMS service
    // await smsProvider.send(smsOptions);

    return true;
  } catch (error) {
    console.error("Error sending security alert SMS:", error);
    return false;
  }
};

/**
 * Send guardian notification
 */
export const sendGuardianNotification = async (
  phoneNumber: string,
  guardianName: string,
  userInfo: string,
): Promise<boolean> => {
  try {
    console.log(`Sending guardian notification SMS to ${phoneNumber}`);

    const message = `${guardianName}، تلقت ${userInfo} طلب زواج جديد. يرجى مراجعة الطلب والموافقة عليه.`;

    const smsOptions: SMSOptions = {
      to: phoneNumber,
      message,
    };

    // Here you would call your actual SMS service
    // await smsProvider.send(smsOptions);

    return true;
  } catch (error) {
    console.error("Error sending guardian notification SMS:", error);
    return false;
  }
};

export default {
  sendPhoneVerificationOTP,
  sendMarriageRequestSMS,
  sendSecurityAlert,
  sendGuardianNotification,
};
