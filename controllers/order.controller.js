const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");

const {
  createCashOnDeliveryOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderService,
} = require("../services/order.service");

const createCashOnDeliveryOrder = asyncWrapper(async (req, res) => {
  const { user } = req;

  const order = await createCashOnDeliveryOrderService({
    userId: user._id,
    addressId: req.body?.addressId,
    shippingAddress: req.body?.shippingAddress,
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Order created successfully",
    data: { order },
  });
});

const getOrders = asyncWrapper(async (req, res) => {
  const { orders, paginatedResults } = await getOrdersService(req.query);
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { orders },
  });
});

const getOrderById = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const order = await getOrderByIdService(orderId);
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { order },
  });
});

const updateOrderStatus = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  await updateOrderService(orderId, { orderStatus });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Order status updated successfully",
  });
});

module.exports = {
  createCashOnDeliveryOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
