import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,     // Gmail
    pass: process.env.EMAIL_PASS,     // App Password
  },
});

export async function sendWarningMail(orgEmail, notificationData) {
  const { 
    organisationName, 
    isFileHashMatch, 
    isDataHashMatch, 
    notificationId, 
    createdAt,
    isCriticalAlert = false,
    consecutiveMismatches = 0
  } = notificationData;
  
  const mailOptions = {
    from: `"Certify Security" <${process.env.EMAIL_USER}>`,
    to: orgEmail,
    subject: isCriticalAlert 
      ? "🚨 CRITICAL ALERT: 3 Consecutive Certificate Mismatches Detected - CertiFy" 
      : "🔔 Certificate Verification Alert - CertiFy",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${isCriticalAlert ? `
          <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: white;">🚨 CRITICAL SECURITY ALERT</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">
              <strong>${consecutiveMismatches} Consecutive Certificate Mismatches Detected!</strong>
            </p>
          </div>
        ` : `
          <h2 style="color: #4e796b;">Certificate Verification Alert</h2>
        `}

        <p>Dear <b>${organisationName}</b>,</p>
        
        ${isCriticalAlert ? `
          <p style="color: #dc3545; font-weight: bold;">
            ⚠️ URGENT: Your organization has experienced ${consecutiveMismatches} consecutive certificate verification failures. 
            This pattern may indicate a serious security incident or systematic certificate tampering.
          </p>
          <p>
            <strong>IMMEDIATE ACTION REQUIRED:</strong> Please investigate your certificate issuance and storage systems immediately.
          </p>
        ` : `
          <p>A certificate verification has been performed and a notification has been created:</p>
        `}

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Notification ID:</strong> ${notificationId}</p>
          <p><strong>File Hash Match:</strong> ${isFileHashMatch ? '✅ Matched' : '❌ Mismatch'}</p>
          <p><strong>Data Hash Match:</strong> ${isDataHashMatch ? '✅ Matched' : '❌ Mismatch'}</p>
          <p><strong>Timestamp:</strong> ${new Date(createdAt).toLocaleString()}</p>
          ${isCriticalAlert ? `<p style="color: #dc3545;"><strong>Consecutive Failures:</strong> ${consecutiveMismatches}</p>` : ''}
        </div>

        ${!isFileHashMatch || !isDataHashMatch ? `
          <div style="background-color: ${isCriticalAlert ? '#f8d7da' : '#fff3cd'}; padding: 15px; border-left: 4px solid ${isCriticalAlert ? '#dc3545' : '#ffc107'}; margin: 20px 0;">
            <p style="margin: 0;">
              <strong>${isCriticalAlert ? '🚨 CRITICAL' : '⚠️ Warning'}:</strong> 
              Hash mismatches detected. This may indicate certificate tampering or data integrity issues.
            </p>
          </div>
        ` : ''}

        ${isCriticalAlert ? `
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Recommended Actions:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Review recent certificate issuance processes</li>
              <li>Verify certificate storage security</li>
              <li>Check for unauthorized system access</li>
              <li>Contact your security team immediately</li>
              <li>Review tampering analysis images in your dashboard</li>
            </ul>
          </div>
        ` : ''}

        <p>Please log in to your dashboard to review the ${isCriticalAlert ? 'critical ' : ''}details.</p>

        <br/>
        <p>Best regards,<br/>
        <strong>CertiFy Security System</strong></p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;"/>
        <p style="font-size: 12px; color: #999;">
          This is an automated ${isCriticalAlert ? 'critical security ' : ''}notification. 
          ${isCriticalAlert ? 'Please take immediate action.' : 'Please do not reply to this email.'}
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${orgEmail}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    console.error("Full error:", err);
    throw err;
  }
}