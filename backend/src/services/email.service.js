import nodemailer from "nodemailer";

const smtpConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

console.log(`📧 SMTP Config: host=${smtpConfig.host}, port=${smtpConfig.port}, user=${smtpConfig.auth.user ? smtpConfig.auth.user : "⚠️  NOT SET"}`);

const transporter = nodemailer.createTransport(smtpConfig);

// Verify SMTP connection at startup
transporter.verify()
  .then(() => console.log("✅ SMTP connection verified successfully"))
  .catch((err) => console.error("❌ SMTP connection failed:", err.message));

/**
 * Send an OTP email to the user.
 * @param {string} to - Recipient email
 * @param {string} code - The 6-digit OTP code
 * @param {"email_verification"|"password_reset"} type
 */
export async function sendOtpEmail(to, code, type) {
  const isVerification = type === "email_verification";

  const subject = isVerification
    ? "Karta – Verify Your Email"
    : "Karta – Reset Your Password";

  const html = `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#070707;border-radius:16px;color:#ededed;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="font-size:24px;font-weight:800;background:linear-gradient(135deg,#9333ea,#ec4899,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Karta</span>
      </div>
      <h2 style="text-align:center;color:#fff;margin-bottom:8px;">
        ${isVerification ? "Verify Your Email" : "Reset Your Password"}
      </h2>
      <p style="text-align:center;color:#8b8b8b;font-size:14px;margin-bottom:32px;">
        ${isVerification
          ? "Use the code below to verify your email address."
          : "Use the code below to reset your password."
        }
      </p>
      <div style="text-align:center;padding:20px;background:#1c1c1c;border:1px solid #303030;border-radius:12px;margin-bottom:24px;">
        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#fff;font-family:monospace;">${code}</span>
      </div>
      <p style="text-align:center;color:#4e4e4e;font-size:12px;">
        This code expires in <strong style="color:#8b8b8b;">10 minutes</strong>.<br/>
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Karta" <${process.env.SMTP_USER || "noreply@karta.dev"}>`,
    to,
    subject,
    html,
  });
}
