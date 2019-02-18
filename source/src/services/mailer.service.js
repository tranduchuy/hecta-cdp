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
    refreshToken: '1/TokkXRnESwFnkst42sfu1DVDsdL42vbhqrkfZiEzDA8',
    accessToken: 'ya29.Glu0BtTVpZ5SCPnzHHoUDz1NbKkiYadNUH5JFaI_6xguaMI7quCoJPFs1BmzIA3wMblycjDyv7cK-veDLIgzlEYrod05a8B4PUxq2HftC0JZxsD3DaTIilLxBJ4T',
    expires: 3600
  },
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