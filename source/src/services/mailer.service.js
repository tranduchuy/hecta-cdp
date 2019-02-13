const NodeMailer = require('nodemailer');
const GlobalConstant = require('../constants/global.constant');
const config = require('config');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Service);

const transporter = NodeMailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: "cskh.hecta@gmail.com",
    clientId: '392023644781-6u308jk38e2n7kl203uaf2gpqvn2foso.apps.googleusercontent.com',
    clientSecret: 'G7PGcCfpq8L4iUZgiHWLiojM',
    refreshToken: '1/ddtYS1ET303Ns6GqwEsAHy1zpbHNkwlsBzSgYY4aqHQ',
    accessToken: 'ya29.GlutBjuqIk8WBKsI9fY0ulf2Ae4e2qDFfQ1naDYh4y5AJuyKxmsz2TPzXQicX84zRR68WMvxseNz_fDU7P0OyfYHl0B5FQHVxnzh4z_rOCEvsMmDY274t2elEhi9',
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
    from: 'cskh.hecta@gmail.com',
    to: email,
    subject: "Hecta VN - Xác nhận đăng kí",
    text: "http://hecta.vn/account-confirm/" + token
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      logger.error('MailService::sendConfirmEmail::error', error);
    } else {
      logger.info(`MailService::sendConfirmEmail::success. Send mail to ${email} successfully`);
    }
  });
};


/**
 * Send email to reset password
 * @param email
 * @param token
 * @returns {Promise<any>}
 */
const sendResetPassword = (email, token) => {
  return new Promise(((resolve, reject) => {
    const mailOptions = {
      from: 'cskh.hecta@gmail.com',
      to: email,
      subject: "Hecta VN - Đổi mật khẩu",
      text: "http://hecta.vn/reset-password/" + token
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  }));
};

module.exports = {
  sendConfirmEmail,
  sendResetPassword
};