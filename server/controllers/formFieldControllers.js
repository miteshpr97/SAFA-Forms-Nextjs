import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSqlRequest, sql, getPool } from "../db/connection.js";

// Api to add form fields
const addFormFields = asyncHandler(async (req, res) => {
  let transaction;

  try {
    const pool = getPool();

    const fieldsArray = Array.isArray(req.body) ? req.body : req.body.fields;

    if (!fieldsArray || fieldsArray.length === 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "No fields provided"));
    }

    // Get form_id from first field
    const form_id = fieldsArray[0].form_id;

    const request = getSqlRequest();

    // Check if the form exists and belongs to the admin's company
    const formCheckQuery = `
        SELECT f.form_id, p.company_id
        FROM tb_gl_forms_form_builder f
        JOIN tb_gl_forms_project p ON f.project_id = p.project_id
        WHERE f.form_id = @form_id
      `;
    request.input("form_id", sql.NVarChar, form_id);
    const checkResult = await request.query(formCheckQuery);
    const form = checkResult.recordset[0];

    if (!form) {
      throw new ApiError(404, "No form found");
    }

    if (req.user.role === "admin" && form.company_id !== req.user.company_id) {
      throw new ApiError(
        403,
        "Admins can only add fields to forms under their own company"
      );
    }

    // Begin transaction
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Get max option_id
    const optionIdResult = await new sql.Request(transaction).query(
      `SELECT MAX(option_id) AS maxOptionId FROM tb_gl_forms_option`
    );
    let maxOptionId = optionIdResult.recordset[0]?.maxOptionId || "O000";
    let optionNumericPart = parseInt(maxOptionId.replace(/\D/g, ""), 10);

    for (const field of fieldsArray) {
      const fieldRequest = new sql.Request(transaction);
      await fieldRequest
        .input("field_id", sql.NVarChar, field.field_id)
        .input("form_id", sql.NVarChar, field.form_id)
        .input("label", sql.NVarChar, field.label)
        .input("type", sql.NVarChar, field.type)
        .input("is_required", sql.Bit, field.is_required)
        .input("placeholder", sql.NVarChar, field.placeholder || "")
        .input("position", sql.Int, field.position)
        .input("validation_regex", sql.NVarChar, field.validation_regex)
        .input("validation_message", sql.NVarChar, field.validation_message)
        .input("created_at", sql.DateTime, new Date())
        .input("updated_at", sql.DateTime, new Date()).query(`
            INSERT INTO tb_gl_forms_field 
            (field_id, form_id, label, type, is_required, placeholder, position, validation_regex, validation_message, created_at, updated_at) 
            VALUES (@field_id, @form_id, @label, @type, @is_required, @placeholder, @position, @validation_regex, @validation_message, @created_at, @updated_at)
          `);

      if (Array.isArray(field.options) && field.options.length > 0) {
        for (const opt of field.options) {
          optionNumericPart++;
          const newOptionId = `O${String(optionNumericPart).padStart(3, "0")}`;
          const optionRequest = new sql.Request(transaction);
          await optionRequest
            .input("option_id", sql.NVarChar, newOptionId)
            .input("field_id", sql.NVarChar, field.field_id)
            .input("form_id", sql.NVarChar, field.form_id)
            .input("option_label", sql.NVarChar, opt.option_label)
            .input("option_value", sql.NVarChar, opt.option_value).query(`
                INSERT INTO tb_gl_forms_option 
                (option_id, field_id, form_id, option_label, option_value) 
                VALUES (@option_id, @field_id, @form_id, @option_label, @option_value)
              `);
        }
      }
    }

    await transaction.commit();
    return res
      .status(201)
      .json(
        new ApiResponse(201, {}, "Fields and options created successfully")
      );
  } catch (error) {
    if (transaction) await transaction.rollback();
    return res
      .status(500)
      .json({ message : "Internal server error", error : error.message});
  }
});

// Api to get Fields of a particular form
const getFieldsByFormId = asyncHandler(async (req, res) => {
  const { form_id } = req.params;
  const user_id = req.user.user_id;

  if (!form_id) {
    throw new ApiError(400, "Please provide Form Id");
  }

  const request = getSqlRequest();

  // Step 1: Check if the form belongs to the company and the user has access (only for user role)
  const isUser = req.user.role === "user";
  
  const formCheckQuery = `
  SELECT f.form_id, p.company_id ${isUser ? ", a.form_YN" : ""}
  FROM tb_gl_forms_form_builder f
  JOIN tb_gl_forms_project p ON f.project_id = p.project_id
  ${isUser ? "INNER JOIN tb_gl_forms_access_management a ON f.form_id = a.form_id AND a.user_id = @user_id" : ""}
  WHERE f.form_id = @form_id
`;

  request.input("form_id", sql.NVarChar, form_id);
  request.input("user_id", sql.NVarChar, user_id);

  const checkResult = await request.query(formCheckQuery);
  const form = checkResult.recordset[0];

  if (!form) {
    throw new ApiError(404, "No form found or access denied");
  }

  // For users, check if they have access to the form
  if (isUser && form.form_YN !== 'Y') {
    throw new ApiError(403, "You do not have permission to view fields of this form");
  }

  // For both admins and users, ensure the form belongs to their company
  if (req.user.role !== "super admin" && form.company_id !== req.user.company_id) {
    throw new ApiError(403, "You can only view fields of forms of your own company");
  }

  // Step 2: Fetch fields with options
  const fieldsQuery = `
    SELECT 
      f.field_id,
      f.form_id,
      f.type,
      f.is_required,
      f.position,
      f.label,
      f.placeholder,
      ISNULL((
          SELECT o.option_id, o.option_label, o.option_value
          FROM tb_gl_forms_option o
          WHERE o.field_id = f.field_id
          FOR JSON PATH
      ), '[]') AS options,
      form.form_name
    FROM tb_gl_forms_field f
    JOIN tb_gl_forms_form_builder form ON f.form_id = form.form_id
    WHERE f.form_id = @form_id
    ORDER By f.position
  `;
  const result = await request.query(fieldsQuery);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "There isn't any field related to the specified form");
  }

  const response = {
    form_name: result.recordset[0].form_name,
    Fields: result.recordset.map((field) => ({
      field_id: field.field_id,
      form_id: field.form_id,
      type: field.type,
      is_required: field.is_required,
      position: field.position,
      label: field.label,
      placeholder: field.placeholder,
      options: JSON.parse(field.options),
    })),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Fields fetched successfully"));
});

// Api to update formFields
const updateOrInsertFormFields = asyncHandler(async (req, res) => {
  let transaction;

  try {
    const pool = getPool();
    const fieldsArray = Array.isArray(req.body) ? req.body : req.body.fields;

    if (!fieldsArray || fieldsArray.length === 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "No fields provided for update"));
    }

    const formId = fieldsArray[0]?.form_id;

    const checkRequest = getSqlRequest();
    const formCheckQuery = `
        SELECT f.form_id, p.company_id
        FROM tb_gl_forms_form_builder f
        JOIN tb_gl_forms_project p ON f.project_id = p.project_id
        WHERE f.form_id = @form_id
      `;
    checkRequest.input("form_id", sql.NVarChar, formId);
    const checkResult = await checkRequest.query(formCheckQuery);
    const form = checkResult.recordset[0];

    if (!form) {
      throw new ApiError(404, "No form found");
    }

    if (req.user.role === "admin" && form.company_id !== req.user.company_id) {
      throw new ApiError(
        403,
        "Admins can only update fields of forms under their own company"
      );
    }

    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // **Get all existing field IDs for this form**
    const existingFieldsResult = await new sql.Request(transaction)
      .input("form_id", sql.NVarChar, formId)
      .query(`SELECT field_id FROM tb_gl_forms_field WHERE form_id = @form_id`);

    const existingFieldIds = new Set(
      existingFieldsResult.recordset.map((row) => row.field_id)
    );
    const receivedFieldIds = new Set(
      fieldsArray.map((field) => field.field_id)
    );

    // **Delete fields not present in the request**
    for (const fieldId of existingFieldIds) {
      if (!receivedFieldIds.has(fieldId)) {
        await new sql.Request(transaction)
          .input("field_id", sql.NVarChar, fieldId)
          .query(`DELETE FROM tb_gl_forms_field WHERE field_id = @field_id`);
      }
    }

    // Fetch max option_id for auto-increment logic
    const optionIdResult = await new sql.Request(transaction).query(
      `SELECT MAX(option_id) AS maxOptionId FROM tb_gl_forms_option`
    );
    let maxOptionId = optionIdResult.recordset[0]?.maxOptionId || "O000";
    let optionNumericPart = parseInt(maxOptionId.replace(/\D/g, ""), 10);

    for (const field of fieldsArray) {
      const checkField = await new sql.Request(transaction)
        .input("field_id", sql.NVarChar, field.field_id)
        .input("form_id", sql.NVarChar, field.form_id)
        .query(
          `SELECT 1 FROM tb_gl_forms_field WHERE field_id = @field_id AND form_id = @form_id`
        );

      if (checkField.recordset.length > 0) {
        // **Update existing field**
        await new sql.Request(transaction)
          .input("field_id", sql.NVarChar, field.field_id)
          .input("form_id", sql.NVarChar, field.form_id)
          .input("label", sql.NVarChar, field.label)
          .input("type", sql.NVarChar, field.type)
          .input("is_required", sql.Bit, field.is_required)
          .input("placeholder", sql.NVarChar, field.placeholder || "")
          .input("position", sql.Int, field.position )
          .input("updated_at", sql.DateTime, new Date())
          .query(
            `UPDATE tb_gl_forms_field 
                       SET label = @label, type = @type, is_required = @is_required, 
                           placeholder = @placeholder, position = @position, updated_at = @updated_at
                       WHERE field_id = @field_id AND form_id = @form_id`
          );
      } else {
        // **Insert new field**
        await new sql.Request(transaction)
          .input("field_id", sql.NVarChar, field.field_id)
          .input("form_id", sql.NVarChar, field.form_id)
          .input("label", sql.NVarChar, field.label)
          .input("type", sql.NVarChar, field.type)
          .input("is_required", sql.Bit, field.is_required)
          .input("placeholder", sql.NVarChar, field.placeholder || "")
          .input("position", sql.Int, field.position )
          .input("created_at", sql.DateTime, new Date())
          .input("updated_at", sql.DateTime, new Date())
          .query(
            `INSERT INTO tb_gl_forms_field (field_id, form_id, label, type, is_required, placeholder, position, created_at, updated_at) 
                       VALUES (@field_id, @form_id, @label, @type, @is_required, @placeholder, @position, @created_at, @updated_at)`
          );
      }

      // **Handle options**
      const existingOptionsResult = await new sql.Request(transaction)
        .input("field_id", sql.NVarChar, field.field_id)
        .query(
          `SELECT option_id FROM tb_gl_forms_option WHERE field_id = @field_id`
        );

      const existingOptionIds = new Set(
        existingOptionsResult.recordset.map((row) => row.option_id)
      );
      const receivedOptionIds = new Set(
        (field.options || []).map((opt) => opt.option_id)
      );

      // **Delete options not present in the request**
      for (const optionId of existingOptionIds) {
        if (!receivedOptionIds.has(optionId)) {
          await new sql.Request(transaction)
            .input("option_id", sql.NVarChar, optionId)
            .query(
              `DELETE FROM tb_gl_forms_option WHERE option_id = @option_id`
            );
        }
      }

      if (Array.isArray(field.options) && field.options.length > 0) {
        for (const opt of field.options) {
          if (existingOptionIds.has(opt.option_id)) {
            // **Update existing option**
            await new sql.Request(transaction)
              .input("option_id", sql.NVarChar, opt.option_id)
              .input("option_label", sql.NVarChar, opt.option_label)
              .input("option_value", sql.NVarChar, opt.option_value)
              .query(
                `UPDATE tb_gl_forms_option 
                               SET option_label = @option_label, option_value = @option_value 
                               WHERE option_id = @option_id`
              );
          } else {
            // **Generate new option_id**
            optionNumericPart++;
            const newOptionId = `O${String(optionNumericPart).padStart(
              3,
              "0"
            )}`;

            // **Insert new option**
            await new sql.Request(transaction)
              .input("option_id", sql.NVarChar, newOptionId)
              .input("field_id", sql.NVarChar, field.field_id)
              .input("form_id", sql.NVarChar, field.form_id)
              .input("option_label", sql.NVarChar, opt.option_label)
              .input("option_value", sql.NVarChar, opt.option_value)
              .query(
                `INSERT INTO tb_gl_forms_option (option_id, field_id, form_id, option_label, option_value) 
                               VALUES (@option_id, @field_id, @form_id, @option_label, @option_value)`
              );
          }
        }
      }
    }

    await transaction.commit();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Fields and options updated/inserted/deleted successfully"
        )
      );
  } catch (error) {
    console.error("Error occurred while updating fields:", error);
    if (transaction) await transaction.rollback();
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Failed to update fields", error));
  }
});

// Api to delete Form field
const deleteFormField = asyncHandler(async (req, res) => {
  const { field_id } = req.params;

  if (!field_id) {
    throw new ApiError(400, "Please provide Field Id");
  }

  const request = getSqlRequest();

  // Step 1: Check if field exists and get company_id via join
  const checkQuery = `
      SELECT f.field_id, p.company_id
      FROM tb_gl_forms_field f
      JOIN tb_gl_forms_project p ON f.project_id = p.project_id
      WHERE f.field_id = @field_id
    `;
  request.input("field_id", sql.NVarChar, field_id);
  const checkResult = await request.query(checkQuery);
  const field = checkResult.recordset[0];

  if (!field) {
    throw new ApiError(404, "No Field found");
  }

  // Step 2: Authorization check for admin
  if (req.user.role === "admin" && field.company_id !== req.user.company_id) {
    throw new ApiError(
      403,
      "Admins can only delete fields under their own company"
    );
  }

  // Step 3: Proceed with delete
  const deleteQuery =
    "DELETE FROM tb_gl_forms_field WHERE field_id = @field_id";
  const deleteResult = await request.query(deleteQuery);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Field deleted successfully"));
});

export {
  addFormFields,
  getFieldsByFormId,
  updateOrInsertFormFields,
  deleteFormField,
};
