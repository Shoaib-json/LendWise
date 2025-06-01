import { v2 as cloudinary, ConfigOptions } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
} as ConfigOptions);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "Loan_App",
      allowed_formats: ["png", "jpeg", "jpg", "pdf"],
      resource_type: "auto",
    };
  },
});

export { cloudinary, storage };
