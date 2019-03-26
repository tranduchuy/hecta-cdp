/**
 * @type UserModel
 */
const UserModel = require('../../models/user.model');
/**
 * @type Model
 */
const BalanceModel = require('../../models/balance.model');
/**
 * @type Model
 */
const UserRelationShipModel = require('../../models/user-relationship.model');
/**
 * @type Model
 */
const TransactionModel = require('../../models/transaction.model');
const Sequelize = require('sequelize');
const log4js = require('log4js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const moment = require('moment');

// constant files
const UserRoleConstant = require('../../constants/user-role.constant');
const UserConstant = require('./user.constant');
const UserTypeConstant = require('../../constants/user-type.constant');
const RandomString = require('randomstring');
const StatusConstant = require('../../constants/status.constant');
const GlobalConstant = require('../../constants/global.constant');
const TransactionTypeConstant = require('../../constants/transaction-type.constant');
const PurchaseTypeConstant = require('../../constants/purchase-target-type.constant');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Service);


/**
 * Compare hash password with input plain text
 * @param {string} hashed
 * @param plainText
 * @returns {boolean}
 * @private
 */
const isValidHashPassword = (hashed, plainText) => {
  try {
    return bcrypt.compareSync(plainText, hashed);
  } catch (e) {
    logger.error('UserService::__checkHashPassword::error', e);
    return false;
  }
};


/**
 *
 * @param email
 * @param password
 * @param type
 * @param name
 * @param username
 * @param phone
 * @param address
 * @param city
 * @param district
 * @param ward
 * @param gender
 * @param Date birthday
 * @returns {Promise<this|Errors.ValidationError>|*|void}
 */
const createUser = async ({email, password, type, name, username, phone, address, city, district, ward, gender, birthday, role}) => {
  const salt = bcrypt.genSaltSync(UserConstant.saltLength);
  const tokenEmailConfirm = RandomString.generate({
    length: UserConstant.tokenConfirmEmailLength,
    charset: 'alphabetic'
  });

  const newUser = UserModel.build({
    email,
    passwordHash: bcrypt.hashSync(password, salt),
    passwordSalt: salt,
    type,
    name,
    username,
    phone,
    tokenEmailConfirm,
    status: StatusConstant.PendingOrWaitConfirm,
    address: address || '',
    city: city || null,
    district: district || null,
    ward: ward || null,
    gender: gender || null,
    birthday: birthday || new Date(),
    role: role || UserRoleConstant.EndUser
  });

  return await newUser.save();
};


/**
 * Find user in database by user name or email. Get one
 * @param {string} email
 * @param {string} username
 * @returns {Promise<*>}
 */
const findByEmailOrUsername = async (email, username) => {
  return await UserModel.findOne({
    where: {
      [Sequelize.Op.or]: [{email}, {username}]
    }
  });
};


/**
 * Generate token by data
 * @param {object} data
 * @returns {string}
 */
const generateToken = (data) => {
  const secretKey = config.get('jwt').secret;
  return jwt.sign(data, secretKey, {
    expiresIn: (60 * 60) * UserConstant.tokenExpiredInHour
  });
};


const createBalanceInfo = async (userId) => {
  const newBalance = BalanceModel.build({userId});
  return await newBalance.save();
};


/**
 * Get balance info of user. If user is personal account then get more info of credit and usedCredit
 * @param userId
 * @return {{main1: number, main2: number, promo: number, expiredAt: Date, credit?: number, usedCredit?: number, creditExpiredAt?: Date}}
 */
const getBalanceInfo = async (userId) => {
  const user = await UserModel.findById(userId);
  let balance = await BalanceModel.findOne({where: {userId}});

  if (!balance) {
    balance = await createBalanceInfo(userId);
  }

  const result = {
    main1: balance.main1,
    main2: balance.main2,
    promo: balance.promo,
    expiredAt: balance.expiredAt
  };

  if (user.type === UserTypeConstant.Personal) {
    result.credit = 0;
    result.usedCredit = 0;
    const relation = await UserRelationShipModel.findOne({
      where: {
        childId: userId,
        status: StatusConstant.ChildAccepted,
        delFlag: GlobalConstant.DelFlag.False
      }
    });

    if (relation) {
      result.credit = relation.credit;
      result.usedCredit = relation.usedCredit;

      const parentBalanceInstance = await BalanceModel.findOne({
        where: {
          userId: relation.parentId
        }
      });

      result.creditExpiredAt = parentBalanceInstance.expiredAt;
    }
  } else {
    result.sharedCredit = await UserRelationShipModel.sum('credit', {
      where: {
        parentId: userId
      }
    });
  }

  return result;
};


/**
 * Check user can update type or not. Will be NOT permitted to be updated if
 * + parent of children
 * + child of a parent
 * @param {string | number} userId
 * @returns {Promise<Array>}
 */
const isValidUpdateType = async (userId) => {
  try {
    const findParentResult = await UserRelationShipModel.findAndCountAll({
      where: {
        childId: userId,
        delFlag: GlobalConstant.DelFlag.False
      }
    });

    if (findParentResult.count > 0) {
      return ['Your are child of another account'];
    }

    const findChildrenResult = await UserRelationShipModel.findAndCountAll({
      where: {
        parentId: userId,
        delFlag: GlobalConstant.DelFlag.False
      }
    });

    if (findChildrenResult.count > 0) {
      return ['Your are parent of another accounts'];
    }

    return [];
  } catch (e) {
    logger.error('UserService::isValidUpdateType::error', e);
    return [e.message];
  }
};


/**
 * Block a user when he/she forgot password, then create token to reset password
 * @param {UserModel} user
 * @returns {Promise<*>}
 */
const blockUserForgetPassword = async (user) => {
  const reminderToken = RandomString.generate();
  const reminderExpired = moment().add(2, 'hours');

  // user['status'] = StatusConstant.BlockedByForgetPassword;
  // user['passwordHash'] = bcrypt.hashSync(randomString.generate(10), user['passwordSalt']);
  user['passwordReminderToken'] = reminderToken;
  user['passwordReminderExpire'] = reminderExpired;

  return await user.save();
};


/**
 *
 * @param {Date} expiredOn
 * @returns {boolean}
 */
const isExpiredTokenResetPassword = (expiredOn) => {
  return moment(expiredOn).isBefore(moment());
};


/**
 * Update MAIN_1 money of userId
 * @param {number} userId
 * @param {number} amount
 * @return {Promise<Promise<this|Errors.ValidationError>|*|void>}
 */
const updateMain1 = async (userId, amount) => {
  const balance = await BalanceModel.findOne({
    where: {
      userId
    }
  });

  balance.main1 = balance.main1 + amount;
  return await balance.save();
};


const addTransactionForParentShareCredit = async (parentId, childId, amount, before, after) => {
  const newTransaction = TransactionModel.build({
    userId: parentId,
    fromUserId: childId,
    amount,
    type: TransactionTypeConstant.ShareCredit,
    content: 'Parent share credit to child',
    note: '',
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
};


const addTransactionForChildReceiveCredit = async (parentId, childId, amount, before, after) => {
  const newTransaction = TransactionModel.build({
    userId: childId,
    fromUserId: parentId,
    amount,
    type: TransactionTypeConstant.ReceiveCredit,
    content: 'Child receive credit from parent',
    note: '',
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
};


/**
 * Get balance instance of a user
 * @param {number} userId
 * @return {Promise<BalanceModel>}
 */
const getBalanceInstance = async (userId) => {
  return await BalanceModel.findOne({
    where: {userId}
  });
};


const addTransactionUpdateBalance = async ({parentId, userId, type, before, after, amount}) => {
  let content = '';
  switch (type) {
    case TransactionTypeConstant.AddMain:
      content = 'Admin update main amount';
      break;
    case TransactionTypeConstant.AddPromo:
      content = 'Admin update promo amount';
      break;
  }

  const newTransaction = TransactionModel.build({
    fromUserId: parentId,
    userId,
    type,
    amount,
    content,
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return newTransaction.save();
};


const subtractWalletsByCost = (balanceInfo, cost, wallets) => {
  let _cost = cost;
  let afterBalanceInfo = {...balanceInfo};
  wallets = wallets || ['credit', 'promo', 'main1'];
  // TODO: chưa handle case main2. Chưa có rule cụ thể
  wallets.forEach(walletType => {
    if (afterBalanceInfo[walletType] > _cost) {
      afterBalanceInfo[walletType] -= _cost;
      _cost = 0;
    } else {
      _cost -= afterBalanceInfo[walletType];
      afterBalanceInfo[walletType] = 0;
    }
  });

  return afterBalanceInfo;
};


/**
 *
 * @param {number} userId
 * @param {number} cost
 * @param {string} note
 * @param {number} targetType
 * @returns {Promise<any>}
 */
const updateBalanceWhenBuyingSomething2 = (userId, cost, note, targetType) => {
  return new Promise(async (resolve, reject) => {
    async function updateBalanceInstanceAndTransactions(bBalanceInfo, aBalanceInfo) {
      // update balance instance
      const balanceInstance = await getBalanceInstance(userId);
      balanceInstance.main1 = aBalanceInfo.main1;
      balanceInstance.main2 = aBalanceInfo.main2;
      balanceInstance.promo = aBalanceInfo.promo;
      await balanceInstance.save();
      logger.info(`UserService::updateBalanceWhenBuyingSomething::update balance of user ${userId}`);

      // Create transaction
      try {
        let t = null;
        switch (targetType) {
          case PurchaseTypeConstant.SaleByDay:
            t = await addTransactionCostOfSale(userId, cost, note, bBalanceInfo, aBalanceInfo);
            logger.info(`UserService::updateBalanceWhenBuyingSomething::create transaction sale cost, transaction id ${t.id}`);
            break;


          case PurchaseTypeConstant.UpNew:
            t = await addTransactionCostOfNews(userId, cost, note, bBalanceInfo, aBalanceInfo);
            logger.info(`UserService::updateBalanceWhenBuyingSomething::create transaction up news cost, transaction id ${t.id}`);
            break;


          case PurchaseTypeConstant.SaleByView:
            t = await addTransactionViewPostSale(userId, cost, note, bBalanceInfo, aBalanceInfo);
            logger.info(`UserService::updateBalanceWhenBuyingSomething::create transaction view post sale, transaction id ${t.id}`);
            break;

          case PurchaseTypeConstant.BuyLead:
            t = await addTransactionCostOfBuyingLead(userId, cost, note, bBalanceInfo, aBalanceInfo);
            logger.info(`UserService::updateBalanceWhenBuyingSomething::create transaction of buying lead, transaction id ${t.id}`);
            break;
        }
      } catch (e) {
        return reject(e);
      }
    }

    try {
      const user = await UserModel.findById(userId);
      const bBalanceInfo = await getBalanceInfo(userId);
      let aBalanceInfo;
      bBalanceInfo.credit = bBalanceInfo.credit || 0;

      switch (user.type) {
        // loại user cá nhân
        case UserTypeConstant.Personal:
          aBalanceInfo = await updateBalanceWhenBuyingSomethingCasePersonalUser(bBalanceInfo, cost, targetType);
          const relation = await UserRelationShipModel.findOne({
            where: {
              childId: userId,
              status: StatusConstant.ChildAccepted,
              delFlag: GlobalConstant.DelFlag.False
            }
          });

          if (relation) {
            relation.credit = aBalanceInfo.credit;
            relation.usedCredit = (relation.usedCredit || 0) + cost;
            await relation.save();
            logger.info(`UserService::updateBalanceWhenBuyingSomething::Update relation balance.credit. Relation id ${relation.id}`);
          }

          await updateBalanceInstanceAndTransactions(bBalanceInfo, aBalanceInfo);
          return resolve('Purchasing sale success');

        // loại user công ty
        case UserTypeConstant.Company:
          aBalanceInfo = await updateBalanceWhenBuyingSomethingCaseCompanyUser(bBalanceInfo, cost, targetType);
          await updateBalanceInstanceAndTransactions(bBalanceInfo, aBalanceInfo);
          return resolve('Purchasing sale success');
      }
    } catch (e) {
      logger.error(`UserService::updateBalanceWhenBuyingSomething::error. Not enough amount for purchasing ${targetType}`, e);
      return reject(new Error(e));
    }
  });
};


/**
 *
 * @param {{expiredAt: Date, creditExpiredAt: Date, main1: number, promo: number, credit: number}} bBalanceInfo
 * @param {number} cost
 * @param {number} targetType
 * @return {Promise<any>}
 */
const updateBalanceWhenBuyingSomethingCasePersonalUser = (bBalanceInfo, cost, targetType) => {
  const now = moment().startOf('date');
  const creditExpiredAt = moment(bBalanceInfo.creditExpiredAt).endOf('date');
  const expiredAt = moment(bBalanceInfo.expiredAt).endOf('date');

  // money of parent
  let creditValid = !!(bBalanceInfo.creditExpiredAt && now.isBefore(creditExpiredAt));

  // personal money
  const personalValid = !!(bBalanceInfo.expiredAt && now.isBefore(expiredAt));

  return new Promise((resolve, reject) => {
    if (!creditValid && !personalValid) {
      return reject('Balance expired');
    } else if (creditValid && !personalValid) {
      if (bBalanceInfo.credit < cost) {
        return reject('Not enough money');
      }

      const aBalanceInfo = subtractWalletsByCost(bBalanceInfo, cost, ['credit']);
      return resolve(aBalanceInfo);
    } else if (!creditValid && personalValid) {
      if (availableSubtractOnMain2(targetType)) {
        const total = bBalanceInfo.main1 + +bBalanceInfo.main2 + bBalanceInfo.promo;

        if (total < cost) {
          return reject('Not enough money');
        }

        // cẩn thận, trừ tiền theo thứ tự promo -> main2 -> main1
        const aBalanceInfo = subtractWalletsByCost(bBalanceInfo, cost, ['promo', 'main2', 'main1']);
        return resolve(aBalanceInfo);
      } else {
        const total = bBalanceInfo.main1 + bBalanceInfo.promo;

        if (total < cost) {
          return reject('Not enough money');
        }

        // cẩn thận, trừ tiền theo thứ tự promo -> main1
        const aBalanceInfo = subtractWalletsByCost(bBalanceInfo, cost, ['promo', 'main1']);
        return resolve(aBalanceInfo);
      }
    } else {
      if (availableSubtractOnMain2(targetType)) {
        const total = bBalanceInfo.main1 + bBalanceInfo.main2 + bBalanceInfo.promo + bBalanceInfo.credit;
        if (total < cost) {
          return reject('Not enough money');
        }

        // cẩn thận, trừ tiền theo thứ tự credit -> promo -> main2 -> main1
        const aBalanceInfo = subtractWalletsByCost(bBalanceInfo, cost, ['credit', 'promo', 'main2', 'main1']);
        return resolve(aBalanceInfo);
      } else {
        const total = bBalanceInfo.main1 + bBalanceInfo.promo + bBalanceInfo.credit;
        if (total < cost) {
          return reject('Not enough money');
        }

        // cẩn thận, trừ tiền theo thứ tự credit -> promo -> main1
        const aBalanceInfo = subtractWalletsByCost(bBalanceInfo, cost, ['credit', 'promo', 'main1']);
        return resolve(aBalanceInfo);
      }
    }
  });
};


/**
 *
 * @param {{expiredAt: Date, creditExpiredAt: Date, main1: number, promo: number, credit: number}} bBalanceInfo
 * @param {number} cost
 * @param {number} targetType
 * @return {Promise<any>}
 */
const updateBalanceWhenBuyingSomethingCaseCompanyUser = (bBalanceInfo, cost, targetType) => {
  // personal money
  const now = moment().startOf('date');
  const expiredAt = moment(bBalanceInfo.expiredAt).endOf('date');

  const personalValid = !!(bBalanceInfo.expiredAt && now.isBefore(expiredAt));

  return new Promise(async (resolve, reject) => {
    if (!personalValid) {
      return reject('Balance expired');
    }

    if (availableSubtractOnMain2(targetType)) {
      const total = bBalanceInfo.main1 + bBalanceInfo.main2 + bBalanceInfo.promo;
      if (total < cost) {
        return reject('Not enough money');
      }

      // cẩn thận, trừ tiền theo thứ tự promo -> main2 -> main1
      const aBalanceInfo = subtractWalletsByCost(bBalanceInfo, cost, ['promo', 'main2', 'main1']);
      return resolve(aBalanceInfo);
    } else {
      const total = bBalanceInfo.main1 + bBalanceInfo.promo;
      if (total < cost) {
        return reject('Not enough money');
      }

      // cẩn thận, trừ tiền theo thứ tự promo -> main1
      const aBalanceInfo = subtractWalletsByCost(bBalanceInfo, cost, ['promo', 'main1']);
      return resolve(aBalanceInfo);
    }
  });
};


const addTransactionCostOfSale = async (userId, amount, note, before, after) => {
  const newTransaction = TransactionModel.build({
    userId,
    fromUserId: null,
    amount,
    type: TransactionTypeConstant.PayPost,
    content: 'Cost of sale',
    note,
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
};


const addTransactionCostOfNews = async (userId, amount, note, before, after) => {
  const newTransaction = TransactionModel.build({
    userId,
    fromUserId: null,
    amount,
    type: TransactionTypeConstant.UpNew,
    content: 'Cost of up news',
    note,
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
};


const addTransactionViewPostSale = async (userId, amount, note, before, after) => {
  const newTransaction = TransactionModel.build({
    userId,
    fromUserId: null,
    amount,
    type: TransactionTypeConstant.ViewPostSale,
    content: 'Cost of viewing sales',
    note,
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
};


const addTransactionCostOfBuyingLead = async (userId, amount, note, before, after) => {
  const newTransaction = TransactionModel.build({
    userId,
    fromUserId: null,
    amount,
    type: TransactionTypeConstant.BuyLead,
    content: 'Buying lead',
    note,
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
};


/**
 *
 * @param {{page: number, limit: number}} pagination
 * @param {{sortBy: string, sd: string}} sort
 * @param query
 * @return {Promise<void>}
 */
const getListUser = async (pagination, sort, query) => {
  const _query = {};

  Object.keys(query).forEach(prop => {
    if (isSearchLikeProperty(prop)) {
      _query[prop] = {
        [Sequelize.Op.like]: `%${query[prop]}%`
      };
    } else if (isSearchExactProperty(prop)) {
      _query[prop] = query[prop];
    }
  });

  return await UserModel.findAndCountAll({
    where: _query,
    offset: (pagination.page - 1) * pagination.limit,
    limit: pagination.limit,
    order: [
      [sort.sortBy, sort.sd.toUpperCase()]
    ]
  });
};


/**
 *
 * @param propertyNm
 * @return {boolean}
 */
const isSearchLikeProperty = (propertyNm) => {
  return UserConstant.queryProperties.like.some(q => q === propertyNm);
};


/**
 *
 * @param propertyNm
 * @return {boolean}
 */
const isSearchExactProperty = (propertyNm) => {
  return UserConstant.queryProperties.exactly.some(q => q === propertyNm);
};


const mapBalanceInfoToListUser = async (users) => {
  return await Promise.all(users.map(async (user) => {
    user.balance = await getBalanceInfo(user.id);
    return user;
  }));
};


const findById = async (userId) => {
  return await UserModel.findById(userId);
};


/**
 *
 * @param {number} targetType
 * @return {boolean}
 */
const availableSubtractOnMain2 = (targetType) => {
  return [
    PurchaseTypeConstant.SaleByView,
    PurchaseTypeConstant.BuyLead
  ].includes(targetType);
};

module.exports = {
  addTransactionForParentShareCredit,
  addTransactionForChildReceiveCredit,
  addTransactionUpdateBalance,
  blockUserForgetPassword,
  createBalanceInfo,
  createUser,
  generateToken,
  getBalanceInfo,
  getBalanceInstance,
  getListUser,
  findByEmailOrUsername,
  findById,
  isExpiredTokenResetPassword,
  isValidHashPassword,
  isValidUpdateType,
  mapBalanceInfoToListUser,
  updateMain1,
  updateBalanceWhenBuyingSomething2
};
