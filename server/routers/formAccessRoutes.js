import express from 'express';
import { addFormAccess, getAccessTemplate, getAccessByUserId, updateFormAccess } from '../controllers/formAccessControllers.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// protecting all routes
router.use(verifyToken);

// Router to add form access
router.route("/addAccess").post(authorize("super-admin", "admin"), addFormAccess);

// Router to get access template
router.route("/getTemplate").get(authorize("admin"), getAccessTemplate);

// Router to get access based on user id
router.route("/getAccess/:user_id").get(authorize("super-admin", "admin"), getAccessByUserId);

// Router to update form access
router.route("/updateAccess").patch(authorize("super-admin", "admin"), updateFormAccess);

export { router };