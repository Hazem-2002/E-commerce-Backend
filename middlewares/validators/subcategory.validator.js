const {
  nameRule,
  mongoIdRule,
  limitFieldsRule,
} = require("./common/validationRules");

const createSubcategoryValidator = [
  nameRule("Subcategory", 2, 50).bail({ level: "request" }),
  mongoIdRule("category").bail({ level: "request" }),
];

const getSubcategoriesValidator = [
  mongoIdRule("id").bail({ level: "request" }).optional(),
  limitFieldsRule("Subcategories").bail({ level: "request" }),
];

const getSubcategoryByIdValidator = [
  mongoIdRule("id").bail({ level: "request" }),
];

const updateSubcategoryValidator = [
  mongoIdRule("id").bail({ level: "request" }),
  nameRule("Subcategory", 2, 50).bail({ level: "request" }).optional(),
  mongoIdRule("category").bail({ level: "request" }).optional(),
];

const deleteSubcategoryValidator = [
  mongoIdRule("id").bail({ level: "request" }),
];

module.exports = {
  createSubcategoryValidator,
  getSubcategoriesValidator,
  getSubcategoryByIdValidator,
  updateSubcategoryValidator,
  deleteSubcategoryValidator,
};
