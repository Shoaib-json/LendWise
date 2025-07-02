import express, { Request, Response, NextFunction } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import bodyParser from "body-parser";
import db from "./Db";
import cookieParser from "cookie-parser";
import auth from "./middleware";
import path from "path";
import dotenv from "dotenv";

dotenv.config({path : '../.env'});

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Attach date and cookies to request
declare global {
  namespace Express {
    interface Request {
      user?: any;
      date?: Date;
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  req.date = new Date();
  console.log(req.date, req.method, req.path);
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currUser = req.cookies || null;
  console.log("Cookies:", req.cookies);
  next();
});

// Razorpay Setup using env variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string
});

// Order page
app.get("/order", (req: Request, res: Response) => {
  res.render("order");
});

// Create order
app.post("/create-order", auth, async (req: Request, res: Response) => {
  const { amount, currency = "INR" } = req.body;
  const id = req.user?.id;

  try {
    const options = {
      amount: amount * 100,
      currency,
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    await db.execute(
      `INSERT INTO razorpay_transactions (id, order_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)`,
      [id, order.id, amount, currency, "created"]
    );

    res.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify payment
app.post("/verify-payment", (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isAuthentic = generatedSignature === razorpay_signature;

  if (!isAuthentic) {
    db.execute(
      `UPDATE razorpay_transactions SET status = ? WHERE order_id = ?`,
      ["failed", razorpay_order_id],
      (error) => {
        if (error) {
          console.error("DB error on payment failure:", error);
          return res.status(500).json({ error: "Database error" });
        }
        return res.status(400).json({ error: "Signature verification failed" });
      }
    );
    return;
  }

  db.execute(
    `UPDATE razorpay_transactions SET payment_id = ?, signature = ?, status = ? WHERE order_id = ?`,
    [razorpay_payment_id, razorpay_signature, "paid", razorpay_order_id],
    (error) => {
      if (error) {
        console.error("DB error on payment success:", error);
        return res.status(500).json({ error: "Payment verification failed" });
      }
      res.json({ message: "Payment verified and saved in database." });
    }
  );
});

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("Razorpay + MySQL Integration in TypeScript!");
});

// Start server
const PORT = process.env.PAYMENT_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Payment server running on http://localhost:${PORT}`);
});
