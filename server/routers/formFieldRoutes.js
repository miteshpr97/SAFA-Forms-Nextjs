import express from 'express';
import { addFormFields, getFieldsByFormId, updateOrInsertFormFields, deleteFormField } from '../controllers/formFieldControllers.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protecting all routes
router.use(verifyToken);

// Router to add form
router.route("/addFormFields").post(authorize("super-admin", "admin"), addFormFields);

// Router to get fields of a particular form
router.route("/getFieldsByFormId/:form_id").get(authorize("super-admin", "admin", "user"), getFieldsByFormId);

// Router to update formFields 
router.route("/updateFormFields").put(authorize("super-admin", "admin"), updateOrInsertFormFields);

// Router to delete form
router.route("/deleteFormField/:field_id").delete(authorize("super-admin", "admin"), deleteFormField);

export { router };