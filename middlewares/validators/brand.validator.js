const {
  nameRule,
  mongoIdRule,
  limitFieldsRule,
} = require("./common/validationRules");

const createBrandValidator = [
  nameRule("Brand", 2, 50).bail({ level: "request" }),
];

const getBrandsValidator = [
  limitFieldsRule("Brands").bail({ level: "request" }),
];

const getBrandByIdValidator = [mongoIdRule("id").bail({ level: "request" })];

const updateBrandValidator = [
  mongoIdRule("id").bail({ level: "request" }),
  nameRule("Brand", 2, 50).optional().bail({ level: "request" }),
];

const deleteBrandValidator = [mongoIdRule("id").bail({ level: "request" })];

module.exports = {
  createBrandValidator,
  getBrandsValidator,
  updateBrandValidator,
  getBrandByIdValidator,
  getBrandByIdValidator,
  deleteBrandValidator,
};
