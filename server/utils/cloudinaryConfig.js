import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  const fullPath = path.resolve(localFilePath); 
  try {
    const response = await cloudinary.uploader.upload(fullPath, {
      resource_type: "auto",
    });
    console.log("File uploaded on Cloudinary:", response.url);
    
    return response.url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return null;
  }
};


export { uploadOnCloudinary };