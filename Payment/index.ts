import express, {Request , Response} from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import db from "./Db";
import auth from "./middleware";

const app = express();
app.use(bodyParser.json());


// Razorpay Setup
const razorpay = new Razorpay({
  key_id: "rzp_test_64VOeX8TZ2yPkw",
  key_secret: "ldhOaeGp2uAsIOM2nXc5z7dF"
});

// Create Razorpay Order & Save in DB
app.post('/create-order' , async (req :Request, res : Response) => {
  const { amount, userId, loanId, currency = "INR" } = req.body;

  try {
    const options = {
      amount: amount * 100, // in paise
      currency,
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    await db.execute(
      `INSERT INTO razorpay_transactions 
        (id, loan_id, order_id, amount, currency, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, loanId, order.id, amount, currency, 'created']
    );

    res.json(order);
  } catch (error) {
    console.error("Error in order creation:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});


app.post('/verify-payment', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", "ldhOaeGp2uAsIOM2nXc5z7dF")
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const isAuthentic = generatedSignature === razorpay_signature;

  if (!isAuthentic) {
    db.execute(
      `UPDATE razorpay_transactions SET status = ? WHERE order_id = ?`,
      ['failed', razorpay_order_id],
      (error) => {
        if (error) {
          console.error("Error updating failed status:", error);
          return res.status(500).json({ error: "Database error" });
        }
        return res.status(400).json({ error: "Signature verification failed" });
      }
    );
    return;
  }

  db.execute(
    `UPDATE razorpay_transactions 
     SET payment_id = ?, signature = ?, status = ? 
     WHERE order_id = ?`,
    [razorpay_payment_id, razorpay_signature, 'paid', razorpay_order_id],
    (error) => {
      if (error) {
        console.error("Error in verification:", error);
        return res.status(500).json({ error: "Payment verification failed" });
      }
      res.json({ message: "Payment verified and saved in database." });
    }
  );
});

// Test Route
app.get('/', (req : Request, res : Response) => {
  res.send('Razorpay + MySQL Integration in TypeScript!');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
