import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSqlRequest, sql } from "../db/connection.js";
import { expressjwt as expressJwt } from "express-jwt";
import { sendEmailForPasswordChange } from "../utils/emailServices.js";
import jwksRsa from "jwks-rsa";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const authMiddleware = expressJwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_CLIENT_ID,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

// Api to login through OAuth
const loginWithAuth0 = asyncHandler(async (req, res) => {
  const { email, name, sub: auth0Id } = req.auth; // Get Auth0 user info

  const request = getSqlRequest();
  request.input("email", sql.NVarChar, email);

  const query = `SELECT * FROM tb_gl_forms_users WHERE email = @email`;
  const result = await request.query(query);

  let user;
  if (result.recordset.length === 0) {
    // If user doesn't exist, create one
    const insertQuery = `
          INSERT INTO tb_gl_forms_users (full_name, email, password, role, company_id) 
          VALUES (@full_name, @email, NULL, 'user', NULL)
      `;

    request.input("full_name", sql.NVarChar, name);
    await request.query(insertQuery);

    // Fetch new user
    const newUser = await request.query(query);
    user = newUser.recordset[0];
  } else {
    user = result.recordset[0];
  }

  // Generate JWT for your system
  const jwtToken = jwt.sign(
    { id: user.user_id, email: user.email, role: user.role, company_id: user.company_id },
    process.env.SECRET_KEY,
    { expiresIn: "7d" }
  );

  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(new ApiResponse(200, {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    companyId: user.company_id,
    token: jwtToken,
  }, "Auth0 Login successful"));
});

// Api to add User
const addUser = asyncHandler(async (req, res) => {
  const request = getSqlRequest();

  // Fetch the max user_id
  const maxIdQuery = `SELECT MAX(user_id) as maxUserId FROM tb_gl_forms_users`;
  const result = await request.query(maxIdQuery);
  const maxUserId = result.recordset[0]?.maxUserId || "U000";

  // Extract numeric part and increment
  const numericPart = parseInt(maxUserId.replace(/\D/g, ""), 10) + 1;
  const newUserId = `U${String(numericPart).padStart(3, "0")}`;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Add all required inputs
  request.input("user_id", sql.NVarChar, newUserId);
  request.input("company_id", sql.NVarChar, req.body.company_id);
  request.input("full_name", sql.NVarChar, req.body.full_name);
  request.input("email", sql.NVarChar, req.body.email);
  request.input("password", sql.NVarChar, hashedPassword);
  request.input("user_phone", sql.NVarChar, req.body.user_phone);
  request.input("role", sql.NVarChar, req.body.role);
  request.input("created_at", sql.DateTime, new Date());
  request.input("updated_at", sql.DateTime, new Date());

  // SQL query for insertion
  const query = `
      INSERT INTO tb_gl_forms_users (
        user_id, company_id, full_name, email, password, user_phone, role, created_at, updated_at
      ) VALUES (
        @user_id, @company_id, @full_name, @email, @password, @user_phone, @role, @created_at, @updated_at
      )
    `;

  await request.query(query);

  // Success response
  return res.status(201).json(new ApiResponse(201, { user_id: newUserId }, "User created successfully"));
});

// Api to get user profile
const getProfile = asyncHandler(async (req,res) => {
  return res.status(200).json(new ApiResponse(200, {User : req.user}, "User profile fetched successfully"))
});

// Api to get users
const getUsers = asyncHandler(async (req, res) => {
  const request = getSqlRequest();

  const query = `SELECT * FROM tb_gl_forms_users
              WHERE company_id = @company_id`;
    request.input("company_id", sql.NVarChar, req.user.company_id);

  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No Users found");
  }

  return res.status(200).json(new ApiResponse(200, { Users: result.recordset }, "Users fetched successfully"));
});

// Api to get User by company id (Only for super admin)
const getUserByCompanyId = asyncHandler(async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    throw new ApiError(400, "Please provide company Id");
  }

  const request = getSqlRequest();

  request.input("company_id", sql.NVarChar, company_id);

  const query = "SELECT * FROM tb_gl_forms_users WHERE company_id = @company_id";
  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No User found in the given company");
  }

  return res.status(200).json(new ApiResponse(200, { Users: result.recordset }, "User fetched successfully"));
});

// Api to get User by id
const getUserById = asyncHandler(async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    throw new ApiError(400, "Please provide User Id");
  }

  const request = getSqlRequest();

  request.input("user_id", sql.NVarChar, user_id);

  const query = "SELECT * FROM tb_gl_forms_users WHERE user_id = @user_id";
  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No User found");
  }

  const user = result.recordset[0];

  if( req.user.role === "admin" && user.company_id !== req.user.company_id){
    throw new ApiError(403, "Access Denied");
  }

  return res.status(200).json(new ApiResponse(200, { User: user }, "User fetched successfully"));
});

// Api to delete User
const deleteUser = asyncHandler(async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    throw new ApiError(400, "Please provide User Id");
  }

  const request = getSqlRequest();

  request.input("user_id", sql.NVarChar, user_id);
  const checkQuery = "SELECT * FROM tb_gl_forms_users WHERE user_id = @user_id";
  const checkResult = await request.query(checkQuery);

  if (checkResult.recordset.length === 0) {
    throw new ApiError(404, "No User found");
  }

  const user = checkResult.recordset[0];

  if (req.user.role === "admin" && user.company_id !== req.user.company_id) {
    throw new ApiError(403, "Access denied");
  }

  const deleteQuery = "DELETE FROM tb_gl_forms_users WHERE user_id = @user_id";
  const result = await request.query(deleteQuery);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

// Api to login user
const loginUser = asyncHandler(async (req, res) => {
  const request = getSqlRequest();

  const { email, password } = req.body;

  const query = `
  SELECT 
    u.*, 
    c.company_name
  FROM tb_gl_forms_users AS u
  LEFT JOIN tb_gl_forms_company AS c
    ON u.company_id = c.company_id
  WHERE u.email = @email;
`;
  request.input("email", sql.NVarChar, email);
  const result = await request.query(query);

  if (result.recordset.length === 0) {
    throw new ApiError(404, "No User found with this email");
  }

  const user = result.recordset[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(404, "Invalid email or password");
  }

  const token = jwt.sign(
      { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role, company_id: user.company_id, company_name: user.company_name},
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  return res.status(200).json(new ApiResponse(200, {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
    company_name: user.company_name,
    token: token
  }, "Login successful"));
});

// Api to logout user
const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
});

// Api to forget password
const forgetPassword = asyncHandler(async (req, res) => {
  const request = getSqlRequest();
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(new ApiResponse(400, null, "Email is required"));
  }

  request.input("email", sql.NVarChar, email);

  const checkEmailQuery = `
    SELECT user_id, email
    FROM tb_gl_forms_users
    WHERE email = @email
  `;

  const result = await request.query(checkEmailQuery);

  if (result.recordset.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "Email not found"));
  }

  const user = result.recordset[0];

  const token = jwt.sign(
    { user_id: user.user_id, email: user.email },
    process.env.SECRET_KEY,
    { expiresIn: "60m" }
  );

  await sendEmailForPasswordChange(user.email, token);

  return res.status(200).json(new ApiResponse(200, null, "Password reset link sent to email"));
});

// API for reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  let verifiedUser;
  try {
    verifiedUser = jwt.verify(token, process.env.SECRET_KEY);

    
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json(new ApiResponse(401, null, "Invalid or expired token"));
    }
    throw error; 
  }

  const request = getSqlRequest();

  request.input("email", sql.NVarChar, verifiedUser.email);

  const checkUserQuery = `
    SELECT email
    FROM tb_gl_forms_users
    WHERE email = @email
  `;

  const result = await request.query(checkUserQuery);

  if (result.recordset.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  request.input("password", sql.NVarChar, hashedPassword);

  const updatePasswordQuery = `
    UPDATE tb_gl_forms_users
    SET password = @password
    WHERE email = @email
  `;

  await request.query(updatePasswordQuery);

  return res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
});



export { addUser, getProfile, getUsers, getUserByCompanyId, getUserById, deleteUser, loginUser, logoutUser, forgetPassword, resetPassword, loginWithAuth0, authMiddleware};
