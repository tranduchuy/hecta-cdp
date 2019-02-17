const NodeMailer = require('nodemailer');
const GlobalConstant = require('../constants/global.constant');
const config = require('config');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Service);

const transporter = NodeMailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cskh.hecta@gmail.com',
    pass: 'Batdongsan2018'
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