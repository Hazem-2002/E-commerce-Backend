const authRouter = require("./auth.router");
const usersRouter = require("./users.router");
const categoryRouter = require("./category.router");
const subcategoryRouter = require("./subcategory.router");
const BrandsRouter = require("./brand.router");
const productRouter = require("./product.router");
const reviewRouter = require("./review.router");
const wishlistRouter = require("./wishlist.router");
const addressRouter = require("./address.router");
const couponRouter = require("./coupon.router");
const cartRouter = require("./cart.router");

const mountRouters = (app) => {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/categories", categoryRouter);
  app.use("/api/v1/subcategories", subcategoryRouter);
  app.use("/api/v1/brands", BrandsRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/reviews", reviewRouter);
  app.use("/api/v1/wishlists", wishlistRouter);
  app.use("/api/v1/addresses", addressRouter);
  app.use("/api/v1/coupons", couponRouter);
  app.use("/api/v1/carts", cartRouter);
};

module.exports = mountRouters;
