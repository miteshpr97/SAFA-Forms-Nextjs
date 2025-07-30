import express from "express";
import expressOasGenerator from "express-oas-generator";  
import cors from "cors";
import xssClean from "xss-clean";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import { router as companyRouter } from "./routers/companyRoutes.js";
import { router as projectRouter } from "./routers/projectRoutes.js";
import { router as userRouter } from "./routers/userRoutes.js";
import { router as formRouter } from "./routers/formRoutes.js";
import { router as formFieldRouter } from "./routers/formFieldRoutes.js";
import { router as submissionRouter } from "./routers/submissionRoutes.js";
import { router as accessRouter } from "./routers/formAccessRoutes.js";

const app = express();

expressOasGenerator.init(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Parse incoming requests with JSON payloads and set a size limit of 16KB
app.use(express.json({ limit: "16kb" }));

// Parse cookies from the request headers and make them accessible in req.cookies
app.use(cookieParser());

// Use Helmet middleware for basic security headers
app.use(helmet());

// XSS protection middleware
app.use(xssClean());

// Routes
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/form", formRouter);
app.use("/api/v1/formField", formFieldRouter);
app.use("/api/v1/response", submissionRouter);
app.use("/api/v1/access", accessRouter);

// Error handling middleware 
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  // Fallback for unhandled errors
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

export { app };
