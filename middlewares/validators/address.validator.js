const {
  mongoIdRule,
  nameRule,
  phoneRule,
  addressFieldRule,
  addressNumberFieldRule,
  postalCodeRule,
} = require("./common/validationRules");

const addNewAddressValidator = [
  nameRule("title", "Address title"),
  nameRule("fullName", "User full name"),
  phoneRule("phone", "User phone number"),
  addressFieldRule("country", "User country", 2, 50),
  addressFieldRule("city", "User city", 2, 50),
  addressFieldRule("district", "User district", 2, 50),
  addressFieldRule("street", "User street", 2, 100),
  addressNumberFieldRule("building", " User building number", 1, 999),
  addressNumberFieldRule("floor", "User floor number", 1, 999),
  addressNumberFieldRule("apartment", "User apartment number", 1, 999),
  postalCodeRule("postalCode", "User postal code"),
];

const updateAddressValidator = [
  mongoIdRule("addressId", "Address ID"),
  ...addNewAddressValidator.map((rule) => rule.optional()),
];

const deleteAddressValidator = [mongoIdRule("addressId", "Address ID")];

module.exports = {
  addNewAddressValidator,
  updateAddressValidator,
  deleteAddressValidator,
};
