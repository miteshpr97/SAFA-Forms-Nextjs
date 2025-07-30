import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSqlRequest, sql } from "../db/connection.js";

// Api to add Project
const addProject = asyncHandler( async(req, res) => {
      const request = getSqlRequest();
      const { company_id, project_name } = req.body;

      // Role-based validation
      if (req.user.role === "admin" && company_id !== req.user.company_id) {
          throw new ApiError(403, "Admins can only add projects to their own company");
        }

      // Fetch the max project_id
      const maxIdQuery = `SELECT MAX(project_id) as maxProjectId FROM tb_gl_forms_project`;
      const result = await request.query(maxIdQuery);
      const maxProjectId = result.recordset[0]?.maxProjectId || "P000";

      // Extract numeric part and increment
      const numericPart = parseInt(maxProjectId.replace(/\D/g, ""), 10) + 1;
      const newProjectId = `P${String(numericPart).padStart(3, "0")}`;

      // Add all required inputs
      request.input("project_id", sql.NVarChar, newProjectId);
      request.input("company_id", sql.NVarChar, company_id);
      request.input("project_name", sql.NVarChar, project_name);
      request.input("created_at", sql.DateTime, new Date());
      request.input("updated_at", sql.DateTime, new Date()); 
  
      // SQL query for insertion
      const query = `
      INSERT INTO tb_gl_forms_project (
        project_id, company_id, project_name, created_at, updated_at
      ) VALUES (
        @project_id, @company_id, @project_name, @created_at, @updated_at
      )
    `;
  
      await request.query(query);
  
      // Success response
      return res.status(201).json(new ApiResponse(201, {project_id: newProjectId}, "Project created successfully"));
});

// Api to get projects
const getProjects = asyncHandler(async (req, res) => {
  const { user_id, role } = req.user;
  const company_id = req.user.company_id;

  const request = getSqlRequest();
  let query;

  if (role === "admin") {
    // Admin sees all projects of their company
    query = `SELECT * FROM tb_gl_forms_project WHERE company_id = @company_id`;
    request.input("company_id", sql.NVarChar, company_id);
  } else if (role === "user") {
    // User sees only projects that have forms they have access to
    query = `
      SELECT DISTINCT p.*
      FROM tb_gl_forms_project p
      INNER JOIN tb_gl_forms_form_builder f ON p.project_id = f.project_id
      INNER JOIN tb_gl_forms_access_management a ON f.form_id = a.form_id
      WHERE a.user_id = @user_id AND a.form_YN = 'Y' AND p.company_id = @company_id
    `;
    request.input("user_id", sql.NVarChar, user_id);
    request.input("company_id", sql.NVarChar, company_id);
  } else {
    throw new ApiError(403, "Invalid role");
  }

  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No Projects found");
  }

  return res.status(200).json(
    new ApiResponse(200, { Projects: result.recordset }, "Projects fetched successfully")
  );
});

// Api to get Project by id (Only for super admin)
const getProjectsByCompanyId = asyncHandler(async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    throw new ApiError(400, "Please provide company Id");
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const request = getSqlRequest();

  request.input("company_id", sql.NVarChar, company_id);
  request.input("offset", sql.Int, offset);
  request.input("limit", sql.Int, limit);

  const countResult = await request.query(
    "SELECT COUNT(*) AS total FROM tb_gl_forms_project WHERE company_id = @company_id"
  );
  const total = countResult.recordset[0].total;

  if (total === 0) {
    throw new ApiError(404, "No Project found with this company id");
  }

  const result = await request.query(`
    SELECT * FROM tb_gl_forms_project
    WHERE company_id = @company_id
    ORDER BY project_id desc
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return res.status(200).json(
    new ApiResponse(200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      projects: result.recordset,
    }, "Projects fetched successfully")
  );
});

// Api to get Project by id
const getProjectById = asyncHandler(async (req, res) => {
  const { project_id } = req.params;

  if (!project_id) {
    throw new ApiError(400, "Please provide Project Id");
  }

  const request = getSqlRequest();

  request.input("project_id", sql.NVarChar, project_id);

  const result = await request.query("SELECT * FROM tb_gl_forms_project WHERE project_id = @project_id");

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No Project found");
  }

  const project = result.recordset[0];

  if (req.user.role === "admin" && project.company_id !== req.user.company_id) {
    throw new ApiError(403, "Access Denied");
  }

  return res.status(200).json(
    new ApiResponse(200, { project }, "Project fetched successfully")
  );
});

// Api to update projects
const updateProject = asyncHandler(async (req, res) => {

  console.log("here is updated data show");
  
  const request = getSqlRequest();
  const { project_id } = req.params;
  const { project_name } = req.body;

  console.log(project_id, project_name);
  

  // Check at least one updatable field is provided
  if (!project_name) {
    throw new ApiError(400, "At least one field is required to update");
  }

  // Check if project exists 
  request.input("project_id", sql.NVarChar, project_id);
  const fetchQuery = `SELECT company_id FROM tb_gl_forms_project WHERE project_id = @project_id`;
  const fetchResult = await request.query(fetchQuery);

  if (fetchResult.recordset.length === 0) {
    throw new ApiError(404, "Project not found");
  }

  const existingCompanyId = fetchResult.recordset[0].company_id;

  // Role-based access check 
  if (req.user.role === "admin" && existingCompanyId !== req.user.company_id) {
    throw new ApiError(403, "Admins can only update projects in their own company");
  }

  // Prepare update fields
  let updateFields = [];
  if (project_name) {
    request.input("project_name", sql.NVarChar, project_name);
    updateFields.push("project_name = @project_name");
  }

  request.input("updated_at", sql.DateTime, new Date());
  updateFields.push("updated_at = @updated_at");

  const updateQuery = `
    UPDATE tb_gl_forms_project
    SET ${updateFields.join(", ")}
    WHERE project_id = @project_id
  `;

  await request.query(updateQuery);

  return res.status(200).json(
    new ApiResponse(200, {}, "Project updated successfully")
  );
});

// Api to delete Project
const deleteProject = asyncHandler(async (req, res) => {
  const { project_id } = req.params;

  if (!project_id) {
    throw new ApiError(400, "Please provide Project Id");
  }

  const request = getSqlRequest();

  request.input("project_id", sql.NVarChar, project_id);
  const checkQuery = "SELECT * FROM tb_gl_forms_project WHERE project_id = @project_id";
  const checkResult = await request.query(checkQuery);

  if (checkResult.recordset.length === 0) {
    throw new ApiError(404, "No Project found");
  }

  const project = checkResult.recordset[0];

  if (req.user.role === "admin" && project.company_id !== req.user.company_id) {
    throw new ApiError(403, "Access denied");
  }

  const deleteQuery = "DELETE FROM tb_gl_forms_project WHERE project_id = @project_id";
  const result = await request.query(deleteQuery);
  return res.status(200).json(new ApiResponse(200, {}, "Project deleted successfully"));
});

export { addProject, getProjects, getProjectsByCompanyId, getProjectById, updateProject, deleteProject};

















