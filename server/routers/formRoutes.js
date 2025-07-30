import express from 'express';
import { addForm, getForms, getFormsByCompanyId, getFormById, updateForm } from '../controllers/formControllers.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// protecting all routes
router.use(verifyToken);

// Router to add form
router.route("/addForm").post(authorize("super-admin", "admin"), addForm);

// Router to get forms
router.route("/getForms").get(authorize("admin", "user"), getForms);

// Router to get forms by company id
router.route("/getFormsByCompanyId/:company_id").get(authorize("super-admin"), getFormsByCompanyId);

// Router to get form by id
router.route("/getFormById/:form_id").get(authorize("super-admin", "admin", "user"), getFormById);

// Router to update a form
router.route("/updateForm/:form_id").patch(authorize("super-admin", "admin"), updateForm);

export { router };