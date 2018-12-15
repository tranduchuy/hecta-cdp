const Ajv = require('ajv');
const ajv = Ajv({allErrors: true, jsonPointers: true});
require('ajv-errors')(ajv);

/**
 * @param errors {{message}[]}
 * @returns {string[]}
 */
const getMessages = (errors) => {
  return errors.map(e => e.message)
};

/**
 *
 * @param schema
 * @param data
 * @returns {string[]}
 */
module.exports = (schema, data) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) {
    return [];
  }

  return getMessages(validate.errors);
};