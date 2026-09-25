const express = require("express");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const {
  getOrderByIdValidator,
  updateOrderStatusValidator,
} = require("../middlewares/validators/order.validator");

const validate = require("../middlewares/validators/validate");

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/order.controller");

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .post(createOrder)
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
