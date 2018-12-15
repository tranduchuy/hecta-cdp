const NodeMailer = require('nodemailer');
const config = require('config');

const transporter = NodeMailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: "snowyflowervietnam.com@gmail.com",
    clientId: '822635889511-1q9ud5oj5s78p332l933p6fp2pph5303.apps.googleusercontent.com',
    clientSecret: 'YSYSKS9eN4vatkPruPQVAE9L',
    refreshToken: '1/nLxM0nfUFkQb5uij29DmHWkFO0Ej87_u7vhaN0tCvL8',
    accessToken: 'ya29.GlsGBnSdA7Twz_qs0AgP8mXna4-t6lTmMs9ip-CsPMEAT3Q-UlrDQ2MRhnabt6F2054jbn3c51f1Aih4HErmxYstP9mR0ZI6VElGh3bWzpcK1OrCpZ97c6ZzTK1D',
    expires: 12345
  }
});

/**
 * Send email to confirm user
 * @param email
 * @param token
 */
const sendConfirmEmail = (email, token) => {
  const mailOptions = {
    from: 'snowyflowervietnam.com@gmail.com',
    to: email,
    subject: "Hecta VN - Xác nhận đăng kí",
    text: "http://hecta.vn/account-confirm/" + token
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

/**
 * Send email to reset password
 * @param email
 * @param token
 * @param cb
 */
const sendResetPassword = (email, token, cb) => {
  const mailOptions = {
    from: 'snowyflowervietnam.com@gmail.com',
    to: email,
    subject: "Hecta VN - Đổi mật khẩu",
    text: "http://hecta.vn/reset-password/" + token
  };

  transporter.sendMail(mailOptions, cb);
};

module.exports = {
  sendConfirmEmail,
  sendResetPassword
};