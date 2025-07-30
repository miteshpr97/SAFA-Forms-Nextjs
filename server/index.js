import dotenv from "dotenv";
dotenv.config(); 
import expressOasGenerator from "express-oas-generator";
import swaggerUi from "swagger-ui-express";
import { connectToDatabase } from "./db/connection.js";
import { app } from "./app.js";
import { fileURLToPath } from "url";
import path from 'path';
import express from 'express';

// Helper to get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve React static files in production
if (process.env.NODE_ENV === "production") {
  const root = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(root));

  app.get("*", (req, res) => {
    res.sendFile("index.html", { root });
  });
}

app.get('/openapi.json', (req, res) => {
  const spec = expressOasGenerator.getSpec();
  res.json(spec);
});


app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(
    null,
    {
      swaggerOptions: {
        url: '/openapi.json',   
      },
      explorer: true,            
    }
  )
);

connectToDatabase()
  .then(() => {
    const PORT = process.env.MSSQL_PORT || 5002;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "Failed to start server due to database connection error:",
      err
    );
    process.exit(1);
  });
