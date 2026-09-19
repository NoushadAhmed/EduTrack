const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const username = process.env.EMAIL_USERNAME;
const password = process.env.EMAIL_PASSWORD;

const transport = username && password
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      service: "gmail",
      auth: {
        user: username,
        pass: password,
      },
    })
  : null;

const sendEmail = async (email, secretToken, mode) => {
  try {
    if (!transport) {
      console.warn(
        "Email credentials are not configured. Skipping SMTP send in development mode."
      );
      return { skipped: true, mode };
    }

    if (mode === "OTP") {
      return await transport.sendMail({
        from: username,
        to: email,
        subject: "College ERP OTP",
        html: `
        <h1>Reset Password</h1>
        <p> Here is your OTP to change the password ${secretToken} </p>
      `,
      });
    }

    return { skipped: false, mode };
  } catch (err) {
    console.log("Error in sending email", err.message);
    return { skipped: true, mode, error: err.message };
  }
};

module.exports = sendEmail;
