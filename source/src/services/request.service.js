const GlobalConstant = require('../constants/global.constant');

/**
 * @param {Object} req
 * @return {{page: number, limit: number}}
 */
const extractPaginationCondition = (req) => {
  const cond = {
    page: GlobalConstant.Pagination.DefaultPage,
    limit: GlobalConstant.Pagination.DefaultLimit
  };

  if (req.query.page && !isNaN(req.query.page) && parseInt(req.query.page, 0) > 1) {
    cond.page = parseInt(req.query.page);
  }

  if (req.query.limit && !isNaN(req.query.limit) && parseInt(req.query.limit, 0) > 0) {
    cond.limit = parseInt(req.query.limit, 0);
  }

  return cond;
};

module.exports = {
  extractPaginationCondition
};

