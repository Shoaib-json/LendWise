// ==================== CONTROLLER ====================

// controller/controller.ts
import { Request, Response } from "express";
import connection from "../db";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      date?: Date;
    }
  }
}

export interface Borrower {
  id?: number;
  name: string;
  proof?: string;
  age: number;
  occupation: string;
  reason: string;
  asset: string;
  asset_value: number;
  nominee?: string;
  nominee_proof?: string;
  address: string;
  loan_amount: number;
  user_id: number;
}

export interface Investor {
  id?: number;
  name: string;
  contact: number;
  risk: number;
  user_id: number;
}

export interface BankDetails {
  id?: number;
  account: string;
  bankName: string;
  name: string;
  ifscCode: string;
  user_id: number;
}

export class HomeController {
  static renderForm(req: Request, res: Response): void {
    try {
      res.render("form");
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to render form" });
    }
  }

  static renderHome(req: Request, res: Response): void {
    res.render("home");
  }

  static renderWork(req: Request, res: Response): void {
    res.render("working.ejs");
  }

  static renderAbout(req: Request, res: Response): void {
    res.render("about");
  }

  static renderContact(req: Request, res: Response): void {
    res.render("contact");
  }

  static renderPrivacy(req: Request, res: Response): void {
    res.render("privacy");
  }
}

export class BorrowerController {
  static async createBorrower(req: Request, res: Response): Promise<void> {
    try {
      const {
        name, age, occupation, reason, asset, asset_value,
        nominee, address, loan_amount
      } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const proof = files?.["proof"]?.[0]?.path || null;
      const nominee_proof = files?.["nominee_proof"]?.[0]?.path || null;
      const user_id = req.user?.id;

      // Validation
      const requiredFields = ["name", "age", "occupation", "reason", "asset", "asset_value", "address", "loan_amount"];
      const missingFields = requiredFields.filter((field) => !req.body[field]);
      
      if (missingFields.length) {
        res.status(400).json({
          error: `Missing required fields: ${missingFields.join(", ")}`
        });
        return;
      }

      const ageNum = Number(age);
      const assetValueNum = Number(asset_value);
      const loanAmountNum = Number(loan_amount);

      if (isNaN(ageNum) || isNaN(assetValueNum) || isNaN(loanAmountNum)) {
        res.status(400).json({
          error: "Age, asset value, and loan amount must be numbers"
        });
        return;
      }

      if (loanAmountNum > assetValueNum) {
        res.status(400).json({
          error: "Loan amount cannot exceed asset value"
        });
        return;
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
        user_id
      ];

      connection.query(query, values, (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          res.status(500).json({ error: "Database operation failed" });
          return;
        }

        console.log("Data Inserted Successfully:", result);
        res.redirect("http://localhost:5000/create-order");
      });

    } catch (error) {
      console.error("Error creating borrower:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }

  static async getDashboard(req: Request, res: Response): Promise<void> {
    const user_id = req.user?.id;
    
    if (!user_id) {
      console.log("ID is not existed");
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const query = `SELECT * FROM borrower WHERE id = ?`;
    const countQuery = `SELECT COUNT(*) AS count FROM borrower`;

    try {
      const [result] = await connection.promise().query(query, [user_id]) as any;
      const [countResult] = await connection.promise().query(countQuery) as any;
      
      console.log(result);
      const q = countResult[0].count;
      console.log("Total count:", countResult[0].count);
      
      res.render("dash", { result, q });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  }
}

export class InvestorController {
  static renderInvestorHelp(req: Request, res: Response): void {
    res.render("investor");
  }

  static renderInvestorForm(req: Request, res: Response): void {
    res.render("invest-form");
  }

  static async createInvestor(req: Request, res: Response): Promise<void> {
    try {
      const { name, contact, risk } = req.body;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const contactNum = Number(contact);
      const riskNum = Number(risk);

      if (isNaN(contactNum) || isNaN(riskNum)) {
        res.status(400).json({ error: "Contact and risk must be numbers" });
        return;
      }

      const query = `INSERT INTO investor (contact, name, risk, id) VALUES (?, ?, ?, ?)`;
      const values = [contactNum, name, riskNum, user_id];

      console.log(values);

      connection.query(query, values, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Database error" });
        }

        console.log("Data Inserted Successfully", result);
        res.status(201).json({ message: "Investor created successfully" });
      });

    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ error: "Failed to create investor" });
    }
  }
}

export class BankController {
  static renderAccount(req: Request, res: Response): void {
    res.render("account");
  }

  static async createBankDetails(req: Request, res: Response): Promise<void> {
    try {
      const { account, bankName, name, ifscCode } = req.body;
      const user_id = req.user?.id;

      if (!user_id) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const query = `INSERT INTO bankdetails (account, bankName, name, ifscCode, id) VALUES (?, ?, ?, ?, ?)`;
      const values = [account, bankName, name, ifscCode, user_id];

      connection.query(query, values, (err, result) => {
        if (err) {
          console.log("DB Error");
          return res.status(500).json({ error: "Database error" });
        }

        console.log(result);
        res.status(201).json({ message: "Bank details saved successfully" });
      });

    } catch (error) {
      console.error("Error saving bank details:", error);
      res.status(500).json({ error: "Failed to save bank details" });
    }
  }
}