import fs from "fs/promises";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSqlRequest, sql, getPool } from "../db/connection.js";
import { uploadOnCloudinary } from "../utils/cloudinaryConfig.js";

// Api to submit form responses
// const submitFormResponse = asyncHandler(async (req, res) => {
//   const { form_id, submitted_by, response } = req.body;
  
//   if (!form_id || !submitted_by || !Array.isArray(response) || response.length === 0) {
//     throw new ApiError(400, "Invalid request data");
//   }

//   const isUser = req.user.role === "user";
//   const request = getSqlRequest();
//   request.input("form_id", sql.NVarChar, form_id);
//   if (isUser) request.input("user_id", sql.NVarChar, req.user.user_id);

//   // 1) Check form exists & access
//   const formCompanyQuery = `
//     SELECT p.company_id ${isUser ? ", a.form_Save" : ""}
//     FROM tb_gl_forms_form_builder f
//     JOIN tb_gl_forms_project p ON f.project_id = p.project_id
//     ${isUser ? "INNER JOIN tb_gl_forms_access_management a ON f.form_id=a.form_id AND a.user_id=@user_id" : ""}
//     WHERE f.form_id=@form_id`;
//   const formResult = await request.query(formCompanyQuery);
//   const form = formResult.recordset[0];
//   if (!form) throw new ApiError(404, "Form not found or access denied");
//   if (isUser && form.form_Save !== "Y") {
//     throw new ApiError(403, "No permission to submit this form");
//   }
//   if (req.user.role !== "super admin" && form.company_id !== req.user.company_id) {
//     throw new ApiError(403, "Cannot submit forms for other companies");
//   }

//   // 2) Load all validations for this form
//   const valReq = getSqlRequest();
//   valReq.input("form_id", sql.NVarChar, form_id);
//   const valResult = await valReq.query(`
//     SELECT field_id, validation_regex, validation_message
//     FROM tb_gl_forms_field
//     WHERE form_id=@form_id
//   `);
  
//   const validators = {};
//   for (const { field_id, validation_regex, validation_message } of valResult.recordset) {
//     if (validation_regex) {
//       validators[field_id] = {
//         regex: new RegExp(validation_regex),
//         message: validation_message || "Invalid input",
//       };
//     }
//   }

//   // 3) Validate each response
//   for (const { field_id, response_value } of response) {
//     const v = validators[field_id];
//     if (v && !v.regex.test(response_value)) {
//       throw new ApiError(400, v.message);
//     }
//   }

//   // 4) All good → begin transaction & insert
//   let transaction;
//   try {
//     const pool = getPool();
//     transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     // a) New submission_id
//     const subRes = await new sql.Request(transaction)
//       .query(`SELECT MAX(submission_id) AS maxId FROM tb_gl_forms_submission`);
//     const maxSub = subRes.recordset[0]?.maxId || "S000";
//     const nextSub = parseInt(maxSub.replace(/\D/g, ""), 10) + 1;
//     const submission_id = `S${String(nextSub).padStart(3, "0")}`;

//     await new sql.Request(transaction)
//       .input("submission_id", sql.NVarChar, submission_id)
//       .input("form_id", sql.NVarChar, form_id)
//       .input("submitted_by", sql.NVarChar, submitted_by)
//       .input("submitted_at", sql.DateTime, new Date())
//       .query(`
//         INSERT INTO tb_gl_forms_submission
//           (submission_id, form_id, submitted_by, submitted_at)
//         VALUES
//           (@submission_id, @form_id, @submitted_by, @submitted_at)
//       `);

//     // b) Insert each field response
//     const respRes = await new sql.Request(transaction)
//       .query(`SELECT MAX(response_id) AS maxId FROM tb_gl_forms_field_response`);
//     let nextRespNum = parseInt((respRes.recordset[0]?.maxId || "R000").replace(/\D/g, ""), 10);
//     for (const { field_id, response_value } of response) {
//       nextRespNum++;
//       const response_id = `R${String(nextRespNum).padStart(3, "0")}`;
//       await new sql.Request(transaction)
//         .input("response_id", sql.NVarChar, response_id)
//         .input("submission_id", sql.NVarChar, submission_id)
//         .input("field_id", sql.NVarChar, field_id)
//         .input("response_value", sql.NVarChar, response_value)
//         .query(`
//           INSERT INTO tb_gl_forms_field_response
//             (response_id, submission_id, field_id, response_value)
//           VALUES
//             (@response_id, @submission_id, @field_id, @response_value)
//         `);
//     }

//     await transaction.commit();
//     return res.status(201).json(
//       new ApiResponse(201, { submission_id }, "Form submitted successfully")
//     );
//   } catch (err) {
//     if (transaction) await transaction.rollback();
//     console.error("Submission error:", err);
//     throw new ApiError(500, "Internal Server Error", err);
//   }
// });

const submitFormResponse = asyncHandler(async (req, res) => {

  const tempFilePaths = (req.files || []).map(file => file.path);
  // Step 1: Parse and merge text responses
  let textResponses = [];
  try {
    textResponses = JSON.parse(req.body.response || "[]");
    if (!Array.isArray(textResponses)) throw new Error();
  } catch {
    throw new ApiError(400, "`response` must be a JSON array");
  }

  const { form_id, submitted_by } = req.body;
  if (!form_id || !submitted_by) {
    throw new ApiError(400, "Invalid request data");
  }

  const isUser = req.user.role === "user";
  const request = getSqlRequest();
  request.input("form_id", sql.NVarChar, form_id);
  if (isUser) request.input("user_id", sql.NVarChar, req.user.user_id);

  // Step 2: Check form access
  const formQuery = `
    SELECT p.company_id ${isUser ? ", a.form_Save" : ""}
    FROM tb_gl_forms_form_builder f
    JOIN tb_gl_forms_project p ON f.project_id = p.project_id
    ${isUser ? "INNER JOIN tb_gl_forms_access_management a ON f.form_id = a.form_id AND a.user_id = @user_id" : ""}
    WHERE f.form_id = @form_id`;
  const formResult = await request.query(formQuery);
  const form = formResult.recordset[0];

  if (!form) throw new ApiError(404, "Form not found or access denied");
  if (isUser && form.form_Save !== "Y")
    throw new ApiError(403, "You cannot submit this form");
  if (req.user.role !== "super admin" && form.company_id !== req.user.company_id)
    throw new ApiError(403, "Cannot submit forms outside your company");

  // Step 3: Load field-level validation regex from DB
  const validationRequest = getSqlRequest();
  validationRequest.input("form_id", sql.NVarChar, form_id);
  const validationResult = await validationRequest.query(`
    SELECT field_id, validation_regex, validation_message
    FROM tb_gl_forms_field
    WHERE form_id = @form_id
  `);

  const validators = {};
  for (const { field_id, validation_regex, validation_message } of validationResult.recordset) {
    if (validation_regex) {
      try {
        const cleanRegex = validation_regex.trim(); // 🧼 Trim to remove \n and spaces
        validators[field_id] = {
          regex: new RegExp(cleanRegex, "i"),
          message: validation_message || "Invalid input",
        };
      } catch (e) {
        console.error("Invalid regex for field:", field_id, validation_regex);
      }
    }
  }

  // Step 4: Validate files before upload
  const fileResponses = [];
  if (req.files?.length) {
    for (const file of req.files) {
      const { fieldname: field_id, mimetype, path } = file;
      const validator = validators[field_id];
      if (validator) {
        if (!validator.regex.test(mimetype)) {
          throw new ApiError(400, validator.message || "Invalid file type");
        }
      }

      const url = await uploadOnCloudinary(path);
      if (!url) throw new ApiError(500, "File upload failed");

      fileResponses.push({
        field_id,
        response_value: url,
      });
    }
  }

  // Step 5: Validate text responses
  for (const { field_id, response_value } of textResponses) {
    const v = validators[field_id];
    if (v && !v.regex.test(response_value)) {
      throw new ApiError(400, v.message);
    }
  }

  const allResponses = [...textResponses, ...fileResponses];
  if (allResponses.length === 0) {
    throw new ApiError(400, "No responses submitted");
  }

  // Step 6: Insert into DB using transaction
  let transaction;
  try {
    const pool = getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const subRes = await new sql.Request(transaction).query(
      `SELECT MAX(submission_id) AS maxSubmissionId FROM tb_gl_forms_submission`
    );
    const maxSub = subRes.recordset[0]?.maxSubmissionId || "S000";
    const nextSub = parseInt(maxSub.replace(/\D/g, ""), 10) + 1;
    const submission_id = `S${String(nextSub).padStart(3, "0")}`;

    await new sql.Request(transaction)
      .input("submission_id", sql.NVarChar, submission_id)
      .input("form_id", sql.NVarChar, form_id)
      .input("submitted_by", sql.NVarChar, submitted_by)
      .input("submitted_at", sql.DateTime, new Date())
      .query(`
        INSERT INTO tb_gl_forms_submission (submission_id, form_id, submitted_by, submitted_at)
        VALUES (@submission_id, @form_id, @submitted_by, @submitted_at)
      `);

    const respRes = await new sql.Request(transaction).query(
      `SELECT MAX(response_id) AS maxResponseId FROM tb_gl_forms_field_response`
    );
    let maxResp = respRes.recordset[0]?.maxResponseId || "R000";
    let respNum = parseInt(maxResp.replace(/\D/g, ""), 10);

    for (const { field_id, response_value } of allResponses) {
      respNum++;
      const newResponseId = `R${String(respNum).padStart(3, "0")}`;
      await new sql.Request(transaction)
        .input("response_id", sql.NVarChar, newResponseId)
        .input("submission_id", sql.NVarChar, submission_id)
        .input("field_id", sql.NVarChar, field_id)
        .input("response_value", sql.NVarChar, response_value)
        .query(`
          INSERT INTO tb_gl_forms_field_response
            (response_id, submission_id, field_id, response_value)
          VALUES
            (@response_id, @submission_id, @field_id, @response_value)
        `);
    }

    await transaction.commit();

    return res
      .status(201)
      .json(new ApiResponse(201, { submission_id }, "Form submitted successfully"));
  } catch (err) {
    if (transaction) await transaction.rollback();
    for (const path of tempFilePaths) {
      try {
        await fs.unlink(path);
      } catch (e) {
        console.warn(`Could not delete file: ${path}`);
      }
    }

    console.error("Form submission failed:", err);
    throw new ApiError(500, "Internal Server Error");
  }
});

// Api to get responses (super admin can see all responses, admin can see responses of form which belongs to his compony only and user can see only his responses )
// const getResponses = asyncHandler(async (req, res) => {
//   const { form_id } = req.params;

//   if (!form_id) {
//     throw new ApiError(400, "Please provide Form Id");
//   }

//   const request = getSqlRequest();
//   request.input("form_id", sql.NVarChar, form_id);

//   // Get form's company_id
//   const formCompanyQuery = `
//     SELECT p.company_id, f.form_name
//     FROM tb_gl_forms_form_builder f
//     JOIN tb_gl_forms_project p ON f.project_id = p.project_id
//     WHERE f.form_id = @form_id
//   `;
//   const formResult = await request.query(formCompanyQuery);
//   const form = formResult.recordset[0];

//   if (!form) {
//     throw new ApiError(404, "Form not found");
//   }

//   // Role-based access check
//   if (
//     req.user.role !== "super admin" &&
//     form.company_id !== req.user.company_id
//   ) {
//     throw new ApiError(
//       403,
//       "You can only access responses of forms of your company"
//     );
//   }

//   let query = `
//     SELECT 
//       s.submission_id,
//       s.form_id,
//       f.form_name,
//       s.submitted_by,
//       FORMAT(s.submitted_at, 'yyyy-MM-dd HH:mm:ss') AS submitted_at,
//       r.response_id,
//       r.field_id,
//       ff.label,
//       r.response_value
//     FROM tb_gl_forms_submission s
//     JOIN tb_gl_forms_form_builder f ON s.form_id = f.form_id
//     JOIN tb_gl_forms_field_response r ON s.submission_id = r.submission_id
//     JOIN tb_gl_forms_field ff ON r.field_id = ff.field_id
//     WHERE s.form_id = @form_id
//   `;

//   // Restrict normal users to only their responses
//   if (req.user.role === "user") {
//     query += ` AND s.submitted_by = @submitted_by`;
//     request.input("submitted_by", sql.NVarChar, req.user.user_id);
//   }

//   const responseResult = await request.query(query);

//   if (responseResult.recordset.length === 0) {
//     throw new ApiError(404, "No responses found for this form");
//   }

// // Group by submission_id
// const submissionsMap = new Map();

// responseResult.recordset.forEach((row) => {
//   if (!submissionsMap.has(row.submission_id)) {
//     submissionsMap.set(row.submission_id, {
//       submission_id: row.submission_id,
//       submitted_by: row.submitted_by,
//       submitted_at: row.submitted_at,
//       response: [],
//     });
//   }

//   submissionsMap.get(row.submission_id).response.push({
//     response_id: row.response_id,
//     field_id: row.field_id,
//     field_name: row.label,
//     response_value: row.response_value,
//   });
// });

//   const formattedResponse = {
//     form_id: form_id,
//     form_name: form.form_name,
//     submission: Array.from(submissionsMap.values()),
//   };

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, formattedResponse, "Responses fetched successfully")
//     );
// });

const getResponses = asyncHandler(async (req, res) => {
  const { form_id } = req.params;

  if (!form_id) {
    throw new ApiError(400, "Please provide Form Id");
  }

  const request = getSqlRequest();
  request.input("form_id", sql.NVarChar, form_id);

  // Get form's company_id
  const formCompanyQuery = `
    SELECT p.company_id, f.form_name
    FROM tb_gl_forms_form_builder f
    JOIN tb_gl_forms_project p ON f.project_id = p.project_id
    WHERE f.form_id = @form_id
  `;
  const formResult = await request.query(formCompanyQuery);
  const form = formResult.recordset[0];

  if (!form) {
    throw new ApiError(404, "Form not found");
  }

  // Role-based access check
  if (
    req.user.role !== "super admin" &&
    form.company_id !== req.user.company_id
  ) {
    throw new ApiError(
      403,
      "You can only access responses of forms of your company"
    );
  }

  let query = `
    SELECT 
      s.submission_id,
      s.form_id,
      f.form_name,
      s.submitted_by,
      FORMAT(s.submitted_at, 'yyyy-MM-dd HH:mm:ss') AS submitted_at,
      r.response_id,
      r.field_id,
      ff.label,
      r.response_value
    FROM tb_gl_forms_submission s
    JOIN tb_gl_forms_form_builder f ON s.form_id = f.form_id
    JOIN tb_gl_forms_field_response r ON s.submission_id = r.submission_id
    JOIN tb_gl_forms_field ff ON r.field_id = ff.field_id
    WHERE s.form_id = @form_id
  `;

  // Restrict normal users to only their responses
  if (req.user.role === "user") {
    query += ` AND s.submitted_by = @submitted_by`;
    request.input("submitted_by", sql.NVarChar, req.user.user_id);
  }

  const responseResult = await request.query(query);

  if (responseResult.recordset.length === 0) {
    throw new ApiError(404, "No responses found for this form");
  }

// Group by submission_id
const submissionsMap = new Map();

responseResult.recordset.forEach((row) => {
  if (!submissionsMap.has(row.submission_id)) {
    submissionsMap.set(row.submission_id, {
      submission_id: row.submission_id,
      submitted_by: row.submitted_by,
      submitted_at: row.submitted_at,
      response: [],
    });
  }

  submissionsMap.get(row.submission_id).response.push({
    response_id: row.response_id,
    field_id: row.field_id,
    field_name: row.label,
    response_value: row.response_value,
  });
});

  const formattedResponse = {
    form_id: form_id,
    form_name: form.form_name,
    submission: Array.from(submissionsMap.values()),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, formattedResponse, "Responses fetched successfully")
    );
});


// API to update form responses (Any user can only update his submission)
const updateFormResponse = asyncHandler(async (req, res) => {
  const { submission_id } = req.params;
  const responseUpdates = req.body;
  if (
    !submission_id ||
    !Array.isArray(responseUpdates) ||
    responseUpdates.length === 0
  ) {
    throw new ApiError(400, "Invalid request data");
  }

  const request = getSqlRequest();
  request.input("submission_id", sql.NVarChar, submission_id);

  // Check if submission exists and who submitted it
  const submissionQuery = `
        SELECT submitted_by 
        FROM tb_gl_forms_submission 
        WHERE submission_id = @submission_id
    `;
  const submissionResult = await request.query(submissionQuery);
  const submission = submissionResult.recordset[0];

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  // Authorization check: Only the user who submitted can update
  if (submission.submitted_by !== req.user.user_id) {
    throw new ApiError(403, "You can only update your own submission");
  }

  let transaction;
  try {
    const pool = getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Update each responseUpdates
    for (const item of responseUpdates) {
      await new sql.Request(transaction)
        .input("response_value", sql.NVarChar, item.response_value)
        .input("response_id", sql.NVarChar, item.response_id)
        .input("submission_id", sql.NVarChar, submission_id)
        .query(
          `UPDATE tb_gl_forms_field_response 
                     SET response_value = @response_value 
                     WHERE response_id = @response_id AND submission_id = @submission_id`
        );
    }

    await transaction.commit();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Responses updated successfully"));
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error updating form responses:", error);
    throw new ApiError(500, "Internal Server Error", error);
  }
});

export { submitFormResponse, getResponses, updateFormResponse };
