import nodemailer from 'nodemailer';

// Setup the email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

//  wrapper template
function buildEmailTemplate(content) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; padding: 40px 20px;">
      <table style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <tr style="background-color: #4f46e5;">
          <td style="padding: 20px; text-align: center;">
            <img src="https://res.cloudinary.com/drdspnw8i/image/upload/v1752223396/Safa_Forms_logo-1-Fit1_eotmis.png" alt="Company Logo" style="height: 50px;" />
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f0f0f0; text-align: center; padding: 20px; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Generic email sender function
async function sendEmail(email, subject, html) {
  const mailOptions = {
    from: '"SAFA Forms" <miteshpradhan97@gmail.com>',
    to: email,
    subject,
    html,
    text: html.replace(/<[^>]+>/g, ''), // optional plain text fallback
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent to", email, "| Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed for:", email);
    throw error;
  }
}

// User creation email
function sendEmailForUserCreation(email, companyName, token) {
  const subject = "Create Your User Account";
  const html = `
    <p>Hello <b>${companyName}</b>,</p>
    <p>Your company has been successfully created. Now you can create a user account by clicking the below link:</p>
    <a href="https://safaforms.visitrace.app/user-creation/${token}" target="_blank">Create User Account</a>
    <p>Thank you!</p>
  `;

  return sendEmail(email, subject, html);
}

// Password reset email using styled template
function sendEmailForPasswordChange(email, token) {
  const subject = "Reset Your Password - SAFA Form";

  const innerContent = `
    <h2 style="color: #333;">Reset Your Password</h2>
    <p style="color: #555; line-height: 1.6;">
      We received a request to reset the password associated with this email address. If you made this request, please click the button below to reset your password:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://safaforms.visitrace.app/resetPassword/${token}"
         style="background-color: #4f46e5; color: white; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #777; font-size: 14px;">
      If you did not request a password reset, please ignore this email or contact support if you have questions.
    </p>
    <p style="color: #aaa; font-size: 12px;">
      This link will expire in 1 hour.<br/><br/>
      If the button doesn't work, copy and paste this link:<br/>
      <a href="https://safaforms.visitrace.app/resetPassword/${token}" style="color: #4f46e5;">https://safaforms.visitrace.app/resetPassword/${token}</a>
    </p>
  `;

  const html = buildEmailTemplate(innerContent);
  return sendEmail(email, subject, html);
}

// Access acknowledgement email using styled template
function sendEmailForAccessAcknowledgement(user, grantedForms = [], revokedForms = []) {
  const subject = "Your Form Access Has Been Updated";

  let bodySections = "";

  if (grantedForms.length) {
    bodySections += `<h4>Newly Granted Access</h4><ul>` +
      grantedForms.map(f => `<li><strong>${f.form_name}</strong> (Project: ${f.project_name})</li>`).join("") +
      `</ul>`;
  }

  if (revokedForms.length) {
    bodySections += `<h4>Access Revoked</h4><ul>` +
      revokedForms.map(f => `<li><strong>${f.form_name}</strong> (Project: ${f.project_name})</li>`).join("") +
      `</ul>`;
  }

  if (!grantedForms.length && !revokedForms.length) {
    bodySections = `<p>No changes in your form access.</p>`;
  }

  const innerContent = `
    <h2 style="color: #333;">Form Access Updated</h2>
    <p style="color: #555;">Dear ${user.full_name || "User"},</p>
    ${bodySections}
    <p style="color: #555;">If you have any questions, please contact your administrator.</p>
    <p style="color: #555;">Regards,<br/>Team</p>
     <p style="margin-top: 30px; font-size: 14px; color: #4f46e5;">
      Visit our website: <a href="https://www.safaforms.visitrace.app/login" target="_blank" style="color: #4f46e5; text-decoration: underline;">www.safaforms.visitrace.app</a>
    </p>
  `;

  const html = buildEmailTemplate(innerContent);
  return sendEmail(user.email, subject, html);
}

// Export all mail functions
export {
  sendEmailForUserCreation,
  sendEmailForPasswordChange,
  sendEmailForAccessAcknowledgement
};
