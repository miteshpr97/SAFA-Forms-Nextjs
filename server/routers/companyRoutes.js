import express from "express";
import { addCompany, getCompanies, getCompanyById, deleteCompany } from "../controllers/companyControllers.js";
import { upload } from "../middleware/multerConfiguration.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";
const router = express.Router();

// Router to add company
router.route("/addCompany").post( upload.single("company_logo"), addCompany);

// Protecting remaining routes
router.use(verifyToken);

// Router to get companies
router.route("/getCompanies").get(authorize("super-admin"), getCompanies );

// Router to get company by id
router.route("/getCompanyById/:company_id").get(authorize("super-admin"), getCompanyById );

// Router to delete company
router.route("/deleteCompany/:company_id").delete(authorize("super-admin"), deleteCompany );

export { router };