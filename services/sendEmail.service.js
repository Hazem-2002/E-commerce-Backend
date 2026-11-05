const transporter = require("../config/mail");

const sendEmail = async (to, subject, template) => {
  const mailOptions = {
    from: `${process.env.APP_NAME} <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: template,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
