// controller/controller.ts
import { Request, Response, NextFunction } from "express";
import connection from "../db";
import AppError from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import dotenv from 'dotenv';

dotenv.config({path : '../.env'})

const port4 = process.env.PAYMENT_PORT;

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
  static renderForm = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.render("form");
  });

  static renderHelp = (req: Request, res: Response): void => {
    res.render("borrowHelp");
  };

  static renderHome = (req: Request, res: Response): void => {
    res.render("home");
  };

  static renderWork = (req: Request, res: Response): void => {
    res.render("working.ejs");
  };

  static renderAbout = (req: Request, res: Response): void => {
    res.render("about");
  };

  static renderContact = (req: Request, res: Response): void => {
    res.render("contact");
  };

  static renderPrivacy = (req: Request, res: Response): void => {
    res.render("privacy");
  };

  static getContact = catchAsync(async(req : Request , res : Response , next : NextFunction) =>{
    const {
      name ,email , message ,subject
    } = req.body;

    const querry = `INSERT INTO contact(name , email , message , subject) VALUES(?,?,?,?)`;

    const values = [
      name,
      email,
      message,
      subject
    ];

    connection.query(querry , values , (err , result)=>{
      if (err) {
        console.log(err)
      }
      console.log(result);
      res.render("thank")
    })
  })
}

export class BorrowerController {
  static createBorrower = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      name, age, occupation, reason, asset, asset_value,
      nominee, address, loan_amount
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const proof = files?.["proof"]?.[0]?.path || null;
    const nominee_proof = files?.["nominee_proof"]?.[0]?.path || null;
    const user_id = req.user?.id;

    if (!user_id) {
      return next(new AppError('User not authenticated', 401));
    }

    // Validation
    const requiredFields = ["name", "age", "occupation", "reason", "asset", "asset_value", "address", "loan_amount"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    
    if (missingFields.length) {
      return next(new AppError(`Missing required fields: ${missingFields.join(", ")}`, 400));
    }

    const ageNum = Number(age);
    const assetValueNum = Number(asset_value);
    const loanAmountNum = Number(loan_amount);

    if (isNaN(ageNum) || isNaN(assetValueNum) || isNaN(loanAmountNum)) {
      return next(new AppError("Age, asset value, and loan amount must be numbers", 400));
    }

    if (loanAmountNum > assetValueNum) {
      return next(new AppError("Loan amount cannot exceed asset value", 400));
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

    try {
      const [result] = await connection.promise().query(query, values);
      console.log("Data Inserted Successfully:", result);
      res.redirect("http://localhost:8080/account");
    } catch (error) {
      console.error("Database Error:", error);
      return next(new AppError("Database operation failed", 500));
    }
  });

  static getDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user_id = req.user?.id;
    
    if (!user_id) {
      return next(new AppError('User not authenticated', 401));
    }

    const query = `SELECT * FROM user WHERE id = ?`;
    const countQuery = `SELECT COUNT(*) AS count FROM borrower`;

    try {
      const [result] = await connection.promise().query(query, [user_id]) as any;
      const [countResult] = await connection.promise().query(countQuery) as any;
      
      console.log(result);
      const q = countResult[0].count;
      console.log("Total count:", countResult[0].count);
      
      res.render("dash", { result, q });
    } catch (error) {
      console.error("Database Error:", error);
      return next(new AppError("Failed to load dashboard", 500));
    }
  });
}

export class InvestorController {
  static renderInvestorHelp = (req: Request, res: Response): void => {
    res.render("investor");
  };

  static renderInvestorForm = (req: Request, res: Response): void => {
    res.render("invest-form");
  };

  static createInvestor = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, contact, risk } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!name || !contact || !risk) {
      return next(new AppError('All fields are required', 400));
    }

    const contactNum = Number(contact);
    const riskNum = Number(risk);

    if (isNaN(contactNum) || isNaN(riskNum)) {
      return next(new AppError("Contact and risk must be numbers", 400));
    }

    const query = `INSERT INTO investor (contact, name, risk, id) VALUES (?, ?, ?, ?)`;
    const values = [contactNum, name, riskNum, user_id];

    try {
      const [result] = await connection.promise().query(query, values);
      console.log("Data Inserted Successfully", result);
      res.redirect(`http://localhost:${port4}/order`);
    } catch (error) {
      console.error("Database Error:", error);
      return next(new AppError("Failed to create investor", 500));
    }
  });
}

export class BankController {
  static renderAccount = (req: Request, res: Response): void => {
    res.render("account");
  };

  static createBankDetails = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { account, bankName, name, ifscCode } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!account || !bankName || !name || !ifscCode) {
      return next(new AppError('All bank details are required', 400));
    }

    const query = `INSERT INTO bankdetails (account, bankName, name, ifscCode, id) VALUES (?, ?, ?, ?, ?)`;
    const values = [account, bankName, name, ifscCode, user_id];

    try {
      const [result] = await connection.promise().query(query, values);
      console.log("Bank details saved successfully:", result);
      res.render("thank");
    } catch (error) {
      console.error("Database Error:", error);
      return next(new AppError("Failed to save bank details", 500));
    }
  });
}