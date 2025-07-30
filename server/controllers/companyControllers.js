import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinaryConfig.js"
import { getSqlRequest, sql } from "../db/connection.js";
import { sendEmailForUserCreation } from "../utils/emailServices.js";
import jwt from 'jsonwebtoken';

// Api to add company
const addCompany = asyncHandler(async (req, res) => {
  const request = getSqlRequest();
  const transaction = new sql.Transaction(request.connection);

  try {

  await transaction.begin();

  const companyLogoPath = req.file?.path;

  let companyLogoUrl = null;
  if (companyLogoPath) {
    companyLogoUrl = await uploadOnCloudinary(companyLogoPath);
    if (!companyLogoUrl) {
      throw new ApiError(500, "Unable to upload on Cloudinary");
    }
  }

  // Fetch the max company_id
  const maxIdQuery = `SELECT MAX(company_id) as maxCompanyId FROM tb_gl_forms_company`;
  const result = await request.query(maxIdQuery);
  const maxCompanyId = result.recordset[0]?.maxCompanyId || "COMP000";

  // Extract numeric part and increment
  const numericPart = parseInt(maxCompanyId.replace(/\D/g, ""), 10) + 1;
  const newCompanyId = `COMP${String(numericPart).padStart(3, "0")}`;

  // Add all required inputs
  request.input("company_id", sql.NVarChar, newCompanyId);
  request.input("company_name", sql.NVarChar, req.body.company_name);
  request.input("company_logo", sql.NVarChar, companyLogoUrl);
  request.input("company_email", sql.NVarChar, req.body.company_email);
  request.input("company_phone", sql.NVarChar, req.body.company_phone);
  request.input("company_address", sql.NVarChar, req.body.company_address);
  request.input("country", sql.NVarChar, req.body.country);
  request.input("state", sql.NVarChar, req.body.state);
  request.input("city", sql.NVarChar, req.body.city);
  request.input("pinCode", sql.NVarChar, req.body.pinCode);
  request.input("is_active", sql.Bit, req.body.is_active ?? 0);
  request.input("created_at", sql.DateTime, new Date());
  request.input("updated_at", sql.DateTime, new Date());

  // SQL query for insertion
  const query = `
      INSERT INTO tb_gl_forms_company (
        company_id, company_name, company_logo, company_email, company_phone, 
        company_address, country, state, city, pinCode, is_active, created_at, updated_at
      ) VALUES (
        @company_id, @company_name, @company_logo, @company_email, @company_phone, 
        @company_address, @country, @state, @city, @pinCode, @is_active, @created_at, @updated_at
      )
    `;

  await request.query(query);

  const token = jwt.sign(
    {
      companyId: newCompanyId,
      companyName: req.body.company_name,
      companyEmail: req.body.company_email,
      companyPhone: req.body.company_phone
    },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );

  // Send email with user creation link

    await sendEmailForUserCreation(req.body.company_email, req.body.company_name, token);

    await transaction.commit();

  // Success response
  return res.status(201).json(new ApiResponse(201, { company_id: newCompanyId }, "Company created successfully"));
} catch (error) {
  await transaction.rollback();
  console.error("Error Occurred", error);

  // Check for unique-constraint violation on the email column
  // 2627 = Violation of PRIMARY KEY or UNIQUE constraint
  if (error.number === 2627) {
    throw new ApiError(409, "That email address is already registered");
  }

  // Fallback for any other errors
  throw new ApiError(500, "Company creation failed, please try again");
}
});

// Api to get companies
const getCompanies = asyncHandler(async (req, res) => {
  const request = getSqlRequest();

  const query = "SELECT * FROM tb_gl_forms_company";
  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No companies found");
  }

  return res.status(200).json(new ApiResponse(200, { companies: result.recordset }, "Companies fetched successfully"));
});

// Api to get company by id
const getCompanyById = asyncHandler(async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    throw new ApiError(400, "Please provide company Id");
  }

  const request = getSqlRequest();

  request.input("company_id", sql.NVarChar, company_id);

  const query = "SELECT * FROM tb_gl_forms_company WHERE company_id = @company_id";
  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No company found");
  }

  return res.status(200).json(new ApiResponse(200, { company: result.recordset[0] }, "Company fetched successfully"));
});

// Api to delete company
const deleteCompany = asyncHandler(async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    throw new ApiError(400, "Please provide company Id");
  }

  const request = getSqlRequest();

  request.input("company_id", sql.NVarChar, company_id);

  const query = "DELETE FROM tb_gl_forms_company WHERE company_id = @company_id";
  const result = await request.query(query);

  if (result.rowsAffected[0] === 0) {
    throw new ApiError(404, "No company found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Company deleted successfully"));
});

export { addCompany, getCompanies, getCompanyById, deleteCompany };
