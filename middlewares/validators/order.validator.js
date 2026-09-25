const { mongoIdRule, orderStatusRule } = require("./common/validationRules");

const getOrderByIdValidator = [mongoIdRule("orderId", "Order ID")];

const updateOrderStatusValidator = [
  mongoIdRule("orderId", "Order ID"),
  orderStatusRule("orderStatus", "Order status"),
];

module.exports = {
  getOrderByIdValidator,
  updateOrderStatusValidator,
};
