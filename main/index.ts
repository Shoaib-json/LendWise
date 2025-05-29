import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import ejs from "ejs";
import ejsMate from "ejs-mate";
import path from "path";
import { fileURLToPath } from 'url';
import methodOverride from "method-override";
import multer from "multer";
import { storage } from "./cloudconfig";
import connection from "./db.ts";
import axios from "axios";
import auth from "./middleware.ts";
import cookieParser from "cookie-parser";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend Request interface to include user and date
declare global {
  namespace Express {
    interface Request {
      user?: any; // Replace with your actual user type
      date?: Date;
    }
  }
}

dotenv.config();

const app = express();

app.use(cookieParser());

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

const upload = multer({ storage });

app.use((req: Request, res: Response, next: NextFunction) => {
  req.date = new Date();
  console.log(req.date, req.method, req.path);
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.render("list/form");
});

app.post(
  "/",
  auth,
  upload.fields([
    { name: "proof", maxCount: 1 },
    { name: "nominee_proof", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        age,
        occupation,
        reason,
        asset,
        asset_value,
        nominee,
        address,
        loan_amount,
      } = req.body;

      const proof = req.files?.["proof"]?.[0]?.path || null;
      const nominee_proof = req.files?.["nominee_proof"]?.[0]?.path || null;
      const id = req.user?.id; // Fixed: removed await since req.user is not a Promise

      const requiredFields = [
        "name",
        "age",
        "occupation",
        "reason",
        "asset",
        "asset_value",
        "address",
        "loan_amount",
      ];

      const missingFields = requiredFields.filter((field) => !req.body[field]);
      if (missingFields.length) {
        return res.status(400).json({
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Data Type Conversion and Validation
      const ageNum = Number(age);
      const assetValueNum = Number(asset_value);
      const loanAmountNum = Number(loan_amount);

      if (isNaN(ageNum) || isNaN(assetValueNum) || isNaN(loanAmountNum)) {
        return res.status(400).json({ 
          error: "Age, asset value, and loan amount must be numbers" 
        });
      }

      if (loanAmountNum > assetValueNum) {
        return res.status(400).json({
          error: "Loan amount cannot exceed asset value",
        });
      }

      const query = `
        INSERT INTO borrower (
          name, proof, age, occupation, reason, 
          asset, asset_value, nominee, nominee_proof, 
          address, loan_amount, id 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        name,
        proof,
        ageNum,
        occupation,
        reason,
        asset,
        assetValueNum,
        nominee || null,
        nominee_proof || null,
        address,
        loanAmountNum,
        id
      ];

      console.log("Insert Query Values:", values);

      // Database Operation
      connection.query(query, values, (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ error: "Database operation failed" });
        }

        console.log("Data Inserted Successfully:", result);
        res.status(200).json({ 
          message: "Application submitted successfully", 
          result 
        });
      });
    } catch (error) {
      console.error("Unexpected Error:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

app.get("/pay", async (req: Request, res: Response) => {
  try {
    const response = await axios.get("https://razorpay.me/@loaner");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(8080, () => {
  console.log("App is listening at port 8080");
});