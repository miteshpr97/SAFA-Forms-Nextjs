import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSqlRequest, sql, getPool } from "../db/connection.js";
import { sendEmailForAccessAcknowledgement } from "../utils/emailServices.js";

// Api to add form access
const addFormAccess = asyncHandler(async (req, res) => {
  const request = getSqlRequest();
  const {
    user_id,
    form_id,
    form_YN,
    form_Save,
    form_Update,
  } = req.body;

  // Check project belongs to admin's company
  if (req.user.role === "admin") {
    const companyCheckQuery = `
      SELECT p.company_id
      FROM tb_gl_forms_project as p
      join 
      tb_gl_forms_form_builder as f
      ON p.project_id = f.project_id
      WHERE f.form_id = @form_id
    `;
    request.input("form_id", sql.NVarChar, form_id);
    const checkResult = await request.query(companyCheckQuery);
    const form = checkResult.recordset[0];

    if (!form || form.company_id !== req.user.company_id) {
      throw new ApiError(
        403,
        "Admins can only add form Access for their own company"
      );
    }
  }

  request.input("user_id", sql.NVarChar, user_id);
  request.input("form_YN", sql.NVarChar, form_YN);
  request.input("form_Save", sql.NVarChar, form_Save);
  request.input("form_Update", sql.NVarChar, form_Update);

  const insertQuery = `
    INSERT INTO tb_gl_forms_access_management (
      user_id, form_id, form_YN, form_Save, form_Update
    ) VALUES (
      @user_id, @form_id, @form_YN, @form_Save, @form_Update
    )
  `;

  await request.query(insertQuery);

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Form created successfully"));
});

// Api to get access template
const getAccessTemplate = asyncHandler(async (req, res) => {
  const company_id = req.user.company_id;
  const { project_id } = req.query;

  const request = getSqlRequest();

  const query = `
    SELECT 
      f.form_id,
      f.form_name,
      '' AS form_YN, 
      '' AS form_Save, 
      '' AS form_Update
    FROM tb_gl_forms_form_builder f
    JOIN tb_gl_forms_project p ON f.project_id = p.project_id
    WHERE p.company_id = @company_id AND p.project_id = @project_id
    ORDER BY form_id DESC
  `;

  request.input("company_id", sql.NVarChar, company_id);
  request.input("project_id", sql.NVarChar, project_id);

  const result = await request.query(query);

  if (result.recordset.length > 0) {
    res.status(200).json(new ApiResponse(200, { template: result.recordset }, "Template fetched successfully"));
  } else {
    res.status(404).send({ message: "No data found for the user/company." });
  }
});

// Api to get access by id
const getAccessByUserId = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const { project_id } = req.query;

  if (!user_id) {
    throw new ApiError(400, "Please provide user_id");
  }

  const request = getSqlRequest();
  request.input("user_id", sql.NVarChar, user_id);

  // Step 1: Get the user's company_id and role
  const userQuery = `
    SELECT u.company_id, u.role
    FROM tb_gl_forms_users u
    WHERE u.user_id = @user_id
  `;
  const userResult = await request.query(userQuery);
  const userInfo = userResult.recordset[0];

  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  const userCompanyId = userInfo.company_id;
  const userRole = userInfo.role;

  // Step 2: Admin check - no access to other admins, and only same company
  if (req.user.role === "admin") {
    if (userRole === "admin") {
      throw new ApiError(403, "You are not authorized to view access for another admin");
    }
    if (userCompanyId !== req.user.company_id) {
      throw new ApiError(403, "You are not authorized to view access for this user");
    }
  }

  // Step 3: Fetch all forms for the company
  request.input("company_id", sql.NVarChar, userCompanyId);
  request.input("project_id", sql.NVarChar, project_id);
  const formQuery = `
    SELECT 
      f.form_id,
      f.form_name,
      p.company_id
    FROM tb_gl_forms_form_builder f
    JOIN tb_gl_forms_project p ON f.project_id = p.project_id
    WHERE p.company_id = @company_id AND p.project_id = @project_id
    ORDER BY form_id DESC
  `;
  const formsResult = await request.query(formQuery);
  const companyForms = formsResult.recordset;

  // Step 4: Fetch existing access records of user
  const accessQuery = `
    SELECT 
      a.user_id,
      a.form_id,
      a.form_YN,
      a.form_Save,
      a.form_Update
    FROM tb_gl_forms_access_management a
    WHERE a.user_id = @user_id
  `;
  const accessResult = await request.query(accessQuery);
  const accessRecords = accessResult.recordset;

  // Step 5: Merge form list with access records
  const mergedAccess = companyForms.map(form => {
    const userAccess = accessRecords.find(a => a.form_id === form.form_id);
    return {
      user_id: user_id,
      form_id: form.form_id,
      form_YN: userAccess?.form_YN || null,
      form_Save: userAccess?.form_Save || null,
      form_Update: userAccess?.form_Update || null,
      form_name: form.form_name,
      company_id: form.company_id,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, mergedAccess, "Access records fetched"));
});

const updateFormAccess = asyncHandler(async (req, res) => {
  const { user_id, accessList } = req.body;
  const grantedForms = [];    
  const revokedForms = [];    

  if (!user_id || !Array.isArray(accessList) || accessList.length === 0) {
    throw new ApiError(400, "user_id and accessList are required and must not be empty");
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {

    const existingReq = new sql.Request(pool);
    existingReq.input("user_id", sql.NVarChar, user_id);
    existingReq.input("form_id", sql.NVarChar, accessList[0].form_id);
    const existingResult = await existingReq.query(`
      SELECT a.form_id, a.form_YN, a.form_Save, a.form_Update
      FROM tb_gl_forms_access_management a
      JOIN tb_gl_forms_form_builder f
        ON a.form_id = f.form_id
      WHERE a.user_id = @user_id
        AND f.project_id  = (SELECT project_id
      FROM tb_gl_forms_form_builder
      WHERE form_id = @form_id);
    `);
    const existingAccessMap = new Map(
      existingResult.recordset.map(r =>
        [r.form_id, (r.form_YN === 'Y' || r.form_Save === 'Y' || r.form_Update === 'Y')]
      )
    );
    
    await transaction.begin();

    for (const access of accessList) {
      const { form_id, form_YN, form_Save, form_Update } = access;
      if (!form_id) {
        throw new ApiError(400, "Each access object must have a form_id");
      }

      // Admin validation & fetch form info
      const formInfoRequest = new sql.Request(transaction);
      formInfoRequest.input("form_id", sql.NVarChar, form_id);
      const formInfoResult = await formInfoRequest.query(`
        SELECT f.form_name, p.project_name, p.company_id
        FROM tb_gl_forms_form_builder f
        JOIN tb_gl_forms_project p ON f.project_id = p.project_id
        WHERE f.form_id = @form_id
      `);
      const form = formInfoResult.recordset[0];
      
      if (!form) {
        throw new ApiError(404, `Form ${form_id} not found`);
      }
      if (req.user.role === "admin" && form.company_id !== req.user.company_id) {
        throw new ApiError(403, `Form ${form_id} does not belong to your company`);
      }

      // Determine grant/revoke
      const hasNewAccess = (form_YN === 'Y' || form_Save === 'Y' || form_Update === 'Y');
      
      const hadOldAccess = existingAccessMap.get(form_id) || false;
      
      if (!hadOldAccess && hasNewAccess) {
        grantedForms.push({
        form_id,
        form_name: form.form_name,
        project_name: form.project_name,
      });
      
      } else if (hadOldAccess && !hasNewAccess) {
        revokedForms.push({
        form_id,
        form_name: form.form_name,
        project_name: form.project_name,
      });
      }

      // Prepare insert/update
      const accessRequest = new sql.Request(transaction);
      accessRequest.input("user_id", sql.NVarChar, user_id);
      accessRequest.input("form_id", sql.NVarChar, form_id);
      accessRequest.input("form_YN", sql.NVarChar, form_YN);
      accessRequest.input("form_Save", sql.NVarChar, form_Save);
      accessRequest.input("form_Update", sql.NVarChar, form_Update);

      const existsResult = await accessRequest.query(`
        SELECT 1 FROM tb_gl_forms_access_management
        WHERE user_id = @user_id AND form_id = @form_id
      `);

      const query = existsResult.recordset.length > 0
        ? `
          UPDATE tb_gl_forms_access_management
          SET form_YN = @form_YN,
              form_Save = @form_Save,
              form_Update = @form_Update
          WHERE user_id = @user_id AND form_id = @form_id
        `
        : `
          INSERT INTO tb_gl_forms_access_management
            (user_id, form_id, form_YN, form_Save, form_Update)
          VALUES
            (@user_id, @form_id, @form_YN, @form_Save, @form_Update)
        `;

      await accessRequest.query(query);
    }

    await transaction.commit();

  } catch (err) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to update access: " + err.message);
  }

  // EMAIL LOGIC
  try {
    const emailRequest = new sql.Request(pool);
    emailRequest.input("user_id", sql.NVarChar, user_id);
    const emailResult = await emailRequest.query(`
      SELECT email, full_name
      FROM tb_gl_forms_users
      WHERE user_id = @user_id
    `);
    const user = emailResult.recordset[0];

    if (user?.email) {
      await sendEmailForAccessAcknowledgement(
        user,
        grantedForms,
        revokedForms
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Access updated successfully"));
  } catch (emailErr) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Access updated, but failed to send email"));
  }
});

export { addFormAccess, getAccessTemplate, getAccessByUserId, updateFormAccess };
