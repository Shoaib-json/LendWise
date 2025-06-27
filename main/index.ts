import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";
import methodOverride from "method-override";
import multer from "multer";
import { storage } from "./cloudconfig";
import connection from "./db";
import axios from "axios";
import auth from "./middleware";
import cookieParser from "cookie-parser";
import cors from "cors" ;



dotenv.config({ path: '../.env' });

const app = express();

app.use(cookieParser());

app.use(cors());
app.set('view engine', 'pug');
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));



declare global {
  namespace Express {
    interface Request {
      user?: any;
      date?: Date;
    }
  }
}

const upload = multer({ storage });

app.use((req: Request, res: Response, next: NextFunction) => {
  req.date = new Date();
  console.log(req.date, req.method, req.path);
  next();
});

app.get("/", (req: Request, res: Response) => {
  try{
    res.render("form");
  }catch (err){
    console.log(err)
  }
  
});


app.post(
  "/",auth ,
  upload.fields([
    { name: "proof", maxCount: 1 },
    { name: "nominee_proof", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
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

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const proof = files?.["proof"]?.[0]?.path || null;
      const nominee_proof = files?.["nominee_proof"]?.[0]?.path || null;
      const id = req.user?.id;

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
        res.status(400).json({
          error: `Missing required fields: ${missingFields.join(", ")}`,
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
          error: "Loan amount cannot exceed asset value",
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
        id
      ];

      console.log("Insert Query Values:", values);

      connection.query(query, values, (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          res.status(500).json({ error: "Database operation failed" });
          return;
        }

        console.log("Data Inserted Successfully:", result);
        res.redirect("http://localhost:5000/create-order")
      });
    } catch (error) {
      console.error("Unexpected Error:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);


app.get("/home" , (req : Request , res : Response)=>{
  res.render("home");
})

app.get("/work" , (req : Request , res : Response)=>{
  res.render("working.ejs")
});

app.get("/investhelp" , (req : Request , res : Response)=>{
  res.render("investor");
})

app.get("/investform" , (req : Request , res : Response)=>{
    res.render("invest-form")
});

app.get("/dashboard", auth, async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) {
    console.log("ID is not existed");
  }
  
  const query = `SELECT * FROM borrower WHERE id = ?`;
  const countQuery = `SELECT COUNT(*) AS count FROM borrower`;

  try {
    const [result] = await connection.promise().query(query, [id]) as any;
    const [countResult] = await connection.promise().query(countQuery) as any;
    
    console.log(result);
    const q = countResult[0].count;
    console.log("Total count:", countResult[0].count);
    
    res.render("dash", {result , q});
  } catch (err) {
    console.log(err);
  }
});

app.post("/accountdetail" , (req : Request , res : Response)=>{
 try{ let {
    account,
    bankName,
    name,
    ifscCode
  } = req.body;

  const id = req.user?.id;
  const q = `INSERT INTO bankdetails (
     account , bankName , name , ifscCode , id) 
     VALUES (?,?,?,?,?)`;

  const Values = [
    account,
    bankName,
    name,
    ifscCode,
    id
  ];

  connection.query(q, Values ,(err , result) =>{
    if(err){
      console.log("DB Error");
    }

    console.log(result);
  })
  res.send("Done")
}catch (err) {
  console.log("something bad happended")
}

});

app.post("/investor-test" ,auth ,(req : Request , res : Response)=>{

 try{ 
  const {
    name,
    contact,
    risk
  }= req.body;
  
  const contactNum = Number(contact);
  const riskNum = Number(risk);
   
  const id = req.user?.id;

  if(!id){
    console.log("missing")
  } 

  const query = `INSERT INTO investor (
  contact , name , risk , id) VALUES (
  ?,?,?,?)`;

  let Values = [
    contactNum ,
    name ,
    riskNum,
    id
  ];

  console.log(Values);

  connection.query(query , Values , (err , result) =>{
    if(err) {
      console.log(err);
      return res.status(500).json({ message: "Database error" });
    }

    console.log("Data Inserted Successfully" , result)
  })
}catch (err){
  console.log(err)
}
})

app.get("/account" , (req : Request , res : Response)=>{
  res.render("account")
});

app.get("/about" , (req :Request , res : Response)=>{
  res.render("about")
})


app.get("/contact" , (req :Request , res : Response)=>{
  res.render("contact")
})

app.get("/privacy" , (req :Request , res : Response)=>{
  res.render("privacy")
})

app.listen(8080, () => {
  console.log("Main service running on port", process.env.MAIN_PORT);
});
