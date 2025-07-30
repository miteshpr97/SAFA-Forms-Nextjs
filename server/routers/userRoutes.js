import express from "express";
import { addUser, getProfile, getUsers, getUserByCompanyId, getUserById, deleteUser, loginUser, logoutUser, forgetPassword, resetPassword, authMiddleware, loginWithAuth0 } from "../controllers/userControllers.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Router to add User
router.route("/addUser").post(addUser);

// Router to login user
router.route("/login").post(loginUser);

// Router to forget password
router.route("/forgetPassword").post(forgetPassword);

// Router to reset password
router.route("/resetPassword/:token").post(resetPassword);

// Router to login user through OAuth
router.route("/auth/auth0").get(authMiddleware, loginWithAuth0);

// Protecting below routes
router.use(verifyToken);

// Router to get user profile
router.route("/getMe").get(getProfile);

// Router to get Users
router.route("/getUsers").get(authorize("admin"), getUsers);

// Router to get Users by company id
router.route("/getUsersByCompanyId/:company_id").get(authorize("super-admin"), getUserByCompanyId);

// Router to get User by id
router.route("/getUserById/:user_id").get(authorize("super-admin", "admin"), getUserById);

// Router to delete User
router.route("/deleteUser/:user_id").delete(authorize("super-admin", "admin"), deleteUser);

// Router to logout user
router.route("/logout").post(logoutUser);

export { router };
