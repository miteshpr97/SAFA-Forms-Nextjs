import express from "express";
import { addProject, getProjects, getProjectsByCompanyId, getProjectById, updateProject, deleteProject } from "../controllers/projectControllers.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protecting all routes
router.use(verifyToken);

// Router to add project
router.route("/addProject").post(authorize("super-admin", "admin"), addProject);

// Router to get projects
router.route("/getProjects").get(authorize("admin", "user"), getProjects);

// Router to get projects by company id
router.route("/getProjectsByCompanyId/:company_id").get(authorize("super-admin"), getProjectsByCompanyId);

// Router to get project by id
router.route("/getProjectById/:project_id").get(authorize("super-admin", "admin", "user"), getProjectById);

// Router to update project
router.route("/updateProject/:project_id").patch(authorize("admin"), updateProject);

// Router to delete project
router.route("/deleteProject/:project_id").delete(authorize("super-admin", "admin"), deleteProject);

export { router };
