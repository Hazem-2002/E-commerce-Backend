const UsersModel = require("../models/users.model");
const ApiError = require("../utils/apiError");

const handleAdminRoleTransition = async (session, operation) => {
  const adminCount = await UsersModel.countDocuments({
    role: "admin",
  }).session(session);

  if (adminCount === 1) {
    const userCount = await UsersModel.countDocuments({
      role: "user",
    }).session(session);

    if (userCount === 0) {
      throw new ApiError(
        400,
        `Cannot ${operation} admin user when there are no other users to promote`,
      );
    }

    await UsersModel.findOneAndUpdate(
      { role: "user" },
      { $set: { role: "admin" } },
      {
        sort: { createdAt: 1 },
        new: true,
      },
    ).session(session);
  }
};

const handleSuperAdminRoleTransition = async (session, operation, role) => {
  const superAdminCount = await UsersModel.countDocuments({
    role: "super-admin",
  }).session(session);

  if (superAdminCount === 1) {
    const adminCount = await UsersModel.countDocuments({
      role: "admin",
    }).session(session);

    if (adminCount >= 1) {
      await UsersModel.findOneAndUpdate(
        { role: "admin" },
        { $set: { role: "super-admin" } },
        {
          sort: { createdAt: 1 },
          new: true,
        },
      ).session(session);
    }

    if ((adminCount === 1 && role !== "admin") || adminCount === 0) {
      const userCount = await UsersModel.countDocuments({
        role: "user",
      }).session(session);

      if (userCount === 0) {
        throw new ApiError(
          400,
          `Cannot ${operation} super-admin user when there are no other users to promote`,
        );
      }

      if (adminCount === 1) {
        await UsersModel.findOneAndUpdate(
          { role: "user" },
          { $set: { role: "admin" } },
          {
            sort: { createdAt: 1 },
            new: true,
            session,
          },
        );
      } else {
        await UsersModel.findOneAndUpdate(
          { role: "user" },
          { $set: { role: "super-admin" } },
          {
            sort: { createdAt: 1 },
            new: true,
            session,
          },
        );
      }
    }
  }
};

module.exports = {
  handleAdminRoleTransition,
  handleSuperAdminRoleTransition,
};
