import express from 'express';
import { submitFormResponse, getResponses, updateFormResponse } from '../controllers/submissionControllers.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/multerConfiguration.js';

const router = express.Router();

// Protecting all routes
router.use(verifyToken);

// Router to add submission or response
router.route("/addSubmission").post(authorize("super-admin", "admin", "user"),
upload.any(),submitFormResponse);

// Router to get responses
router.route("/getResponses/:form_id").get(authorize("super-admin", "admin", "user"), getResponses);

// Router to update responses
router.route('/updateResponse/:submission_id').patch(updateFormResponse);


export { router };