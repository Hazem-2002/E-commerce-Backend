const express = require("express");

const uploadSingle = require("../middlewares/upload/uploadSingle");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const {
  getUsers,
  getUserById,
  updateUser,
  changeUserPassword,
  deleteUser,
} = require("../controllers/users.controller");

const {
  getUserByIdValidator,
  updateUserValidator,
  changeUserPasswordValidator,
  deleteUserValidator,
} = require("../middlewares/validators/users.validator");
const validate = require("../middlewares/validators/validate");

const router = express.Router();

router
  .route("/")
  .get(authenticate, authorize("super-admin", "admin"), getUsers);

router
  .route("/:id")
  .get(
    authenticate,
    authorize("super-admin", "admin"),
    getUserByIdValidator,
    validate,
    getUserById,
  )
  .patch(
    authenticate,
    authorize("super-admin", "admin"),
    uploadSingle("profileImage", false),
    updateUserValidator,
    validate,
    updateUser,
  )
  .delete(
    authenticate,
    authorize("super-admin", "admin"),
    deleteUserValidator,
    validate,
    deleteUser,
  );



module.exports = router;
