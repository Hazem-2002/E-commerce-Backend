const {
  nameRule,
  mongoIdRule,
  limitFieldsRule,
} = require("./common/validationRules");

const createBrandValidator = [nameRule("name", "Brand name", 2, 50)];

const getBrandsValidator = [limitFieldsRule("fields", "Brand fields")];

const getBrandByIdValidator = [mongoIdRule("id", "Brand ID")];

const updateBrandValidator = [
  mongoIdRule("id", "Brand ID"),
  nameRule("name", "Brand name", 2, 50).optional(),
];

const deleteBrandValidator = [mongoIdRule("id", "Brand ID")];

module.exports = {
  createBrandValidator,
  getBrandsValidator,
  getBrandByIdValidator,
  updateBrandValidator,
  deleteBrandValidator,
};
