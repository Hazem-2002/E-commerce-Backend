const express = require("express");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const { doubleCsrfProtection } = require("../config/csrf");

const {
  getOrderByIdValidator,
  updateOrderStatusValidator,
} = require("../middlewares/validators/order.validator");

const validate = require("../middlewares/validators/validate");

const {
  createCashOnDeliveryOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/order.controller");

const router = express.Router();

router.use(authenticate, doubleCsrfProtection);

router
  .route("/")
  .post(createCashOnDeliveryOrder)
  .get(authorize("super-admin", "admin"), getOrders);

router
  .route("/:orderId")
  .get(
    authorize("super-admin", "admin"),
    getOrderByIdValidator,
    validate,
    getOrderById,
  );

router
  .route("/:orderId/status")
  .patch(
    authorize("super-admin", "admin"),
    updateOrderStatusValidator,
    validate,
    updateOrderStatus,
  );

module.exports = router;
