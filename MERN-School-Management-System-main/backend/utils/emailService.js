const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `Teacher Registration System <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message.replace(/<[^>]*>/g, ''), // enlever les balises HTML
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
