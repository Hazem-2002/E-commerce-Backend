const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");

const {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderStatusService,
} = require("../services/order.service");

const createOrder = asyncWrapper(async (req, res) => {
  const { user } = req;
  const order = await createOrderService({ userId: user._id });
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

  await updateOrderStatusService(orderId, orderStatus);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Order status updated successfully",
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
