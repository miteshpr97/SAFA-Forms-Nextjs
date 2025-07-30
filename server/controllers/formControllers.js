import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSqlRequest, sql } from "../db/connection.js";

// Api to add form
const addForm = asyncHandler(async (req, res) => {
  const request = getSqlRequest();
  const { form_name, project_id, description, created_by } = req.body;

  // Check project belongs to admin's company
  if (req.user.role === "admin") {
    const companyCheckQuery = `
      SELECT company_id FROM tb_gl_forms_project WHERE project_id = @project_id
    `;
    request.input("project_id", sql.NVarChar, project_id);
    const checkResult = await request.query(companyCheckQuery);
    const project = checkResult.recordset[0];

    if (!project || project.company_id !== req.user.company_id) {
      throw new ApiError(403, "Admins can only add forms to projects under their own company");
    }
  }

  // Fetch the max form_id
  const maxIdQuery = `SELECT MAX(form_id) as maxformId FROM tb_gl_forms_form_builder`;
  const maxResult = await request.query(maxIdQuery);
  const maxformId = maxResult.recordset[0]?.maxformId || "F000";

  const numericPart = parseInt(maxformId.replace(/\D/g, ""), 10) + 1;
  const newFormId = `F${String(numericPart).padStart(3, "0")}`;

  request.input("form_id", sql.NVarChar, newFormId);
  request.input("form_name", sql.NVarChar, form_name);
  request.input("description", sql.NVarChar, description);
  request.input("created_by", sql.NVarChar, created_by);
  request.input("created_at", sql.DateTime, new Date());
  request.input("updated_at", sql.DateTime, new Date());

  const insertQuery = `
    INSERT INTO tb_gl_forms_form_builder (
      form_id, form_name, project_id, description, created_by, created_at, updated_at
    ) VALUES (
      @form_id, @form_name, @project_id, @description, @created_by, @created_at, @updated_at
    )
  `;

  await request.query(insertQuery);

  return res.status(201).json(new ApiResponse(201, { form_id: newFormId }, "Form created successfully"));
});

// Api to get forms
const getForms = asyncHandler(async (req, res) => {
  const request = getSqlRequest();

  const isUser = req.user.role === "user";

  const query = `
  SELECT 
    f.form_id,
    f.form_name,
    f.project_id,
    p.project_name,
    f.description,
    f.created_by,
    u.full_name,                 
    f.is_active,
    f.created_at,
    f.updated_at,
    CASE
      WHEN ff.form_id IS NOT NULL THEN 'true'
      ELSE 'false'
    END AS has_fields
  FROM tb_gl_forms_form_builder f
  LEFT JOIN tb_gl_forms_field ff
         ON f.form_id = ff.form_id
  JOIN tb_gl_forms_project p
        ON f.project_id = p.project_id
  LEFT JOIN tb_gl_forms_users u      
        ON f.created_by = u.user_id
  ${isUser
      ? "INNER JOIN tb_gl_forms_access_management am ON f.form_id = am.form_id AND am.user_id = @user_id"
      : ""}
  WHERE p.company_id = @company_id
  ${isUser ? "AND am.form_YN = 'Y'" : ""}
  GROUP BY
    f.form_id, f.form_name,
    f.project_id, p.project_name,   
    f.description,
    f.created_by, u.full_name,      
    f.is_active, f.created_at, f.updated_at,
    ff.form_id;
`;

  request.input("company_id", sql.NVarChar, req.user.company_id);
  if (isUser) {
    request.input("user_id", sql.NVarChar, req.user.user_id);
  }

  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No Forms found for this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { Forms: result.recordset }, "Forms fetched successfully"));
});

// Api to get Forms by company id
const getFormsByCompanyId = asyncHandler(async (req, res) => {
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

  // Count total forms
  const countQuery = `
    SELECT COUNT(DISTINCT f.form_id) AS total
    FROM tb_gl_forms_form_builder f
    JOIN tb_gl_forms_project p ON f.project_id = p.project_id
    WHERE p.company_id = @company_id
  `;
  const countResult = await request.query(countQuery);
  const total = countResult.recordset[0].total;

  if (total === 0) {
    throw new ApiError(404, "No forms found with this company id");
  }

  // Fetch paginated forms
  const query = `
    SELECT 
      f.form_id,
      f.form_name,
      f.project_id,
      f.description,
      f.created_by,
      f.is_active,
      f.created_at,
      f.updated_at,
      CASE 
        WHEN ff.form_id IS NOT NULL THEN 'true'
        ELSE 'false'
      END AS has_fields
    FROM tb_gl_forms_form_builder f
    LEFT JOIN tb_gl_forms_field ff ON f.form_id = ff.form_id
    JOIN tb_gl_forms_project p ON f.project_id = p.project_id
    WHERE p.company_id = @company_id
    GROUP BY 
      f.form_id, f.form_name, f.project_id, f.description, 
      f.created_by, f.is_active, f.created_at, f.updated_at, ff.form_id
    ORDER BY f.form_id desc
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;
  const result = await request.query(query);

  return res.status(200).json(
    new ApiResponse(200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      forms: result.recordset,
    }, "Forms fetched successfully")
  );
});

// Api to get Form by id
const getFormById = asyncHandler(async (req, res) => {
  const { form_id } = req.params;
  const user_id = req.user.user_id;

  if (!form_id) {
    throw new ApiError(400, "Please provide form Id");
  }

  const request = getSqlRequest();

  // Check if the user is a "user" or not
  const isUser = req.user.role === "user";
  
  // Conditionally add the INNER JOIN for "user"
  const accessJoin = isUser
    ? `INNER JOIN tb_gl_forms_access_management a ON f.form_id = a.form_id AND a.user_id = @user_id`
    : "";

  const formQuery = `
    SELECT f.*, p.company_id ${isUser ? ", a.form_YN" : ""}
    FROM tb_gl_forms_form_builder f
    JOIN tb_gl_forms_project p ON f.project_id = p.project_id
    ${accessJoin}
    WHERE f.form_id = @form_id
  `;

  request.input("form_id", sql.NVarChar, form_id);
  
  // Add the user_id parameter only if the role is "user"
  if (isUser) {
    request.input("user_id", sql.NVarChar, user_id);
  }

  const result = await request.query(formQuery);
  const form = result.recordset[0];

  if (!form) {
    throw new ApiError(404, "Form not found or access denied");
  }

  // Check permissions based on role
  if (isUser && form.form_YN !== 'Y') {
    throw new ApiError(403, "You do not have permission to view this form");
  }

  if (req.user.role !== "super admin" && form.company_id !== req.user.company_id) {
    throw new ApiError(403, "You can only access forms under your company");
  }

  return res.status(200).json(new ApiResponse(200, { Form: form }, "Form fetched successfully"));
});

// Api to update form
const updateForm = asyncHandler(async (req, res) => {
  const request = getSqlRequest();
  const { form_id } = req.params;
  const { form_name, description } = req.body;

  if (!form_name && !description) {
    throw new ApiError(400, "At least one field is required to update");
  }

  request.input("form_id", sql.NVarChar, form_id);
  const fetchQuery = `
    SELECT fb.project_id, p.company_id
    FROM tb_gl_forms_form_builder fb
    JOIN tb_gl_forms_project p ON fb.project_id = p.project_id
    WHERE fb.form_id = @form_id
  `;
  const result = await request.query(fetchQuery);
  const formData = result.recordset[0];

  if (!formData) {
    throw new ApiError(404, "Form not found");
  }

  if (req.user.role === "admin" && formData.company_id !== req.user.company_id) {
    throw new ApiError(403, "Admins can only update forms under their own company");
  }

  const updateFields = [];
  if (form_name) {
    request.input("form_name", sql.NVarChar, form_name);
    updateFields.push("form_name = @form_name");
  }

  if (description) {
    request.input("description", sql.NVarChar, description);
    updateFields.push("description = @description");
  }

  request.input("updated_at", sql.DateTime, new Date());
  updateFields.push("updated_at = @updated_at");

  const updateQuery = `
    UPDATE tb_gl_forms_form_builder
    SET ${updateFields.join(", ")}
    WHERE form_id = @form_id
  `;

  await request.query(updateQuery);

  return res.status(200).json(
    new ApiResponse(200, { }, "Form updated successfully")
  );
});

export { addForm, getForms, getFormsByCompanyId, getFormById, updateForm };
