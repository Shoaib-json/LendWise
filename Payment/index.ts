import express, { Request, Response, RequestHandler } from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();

// Parse raw body for webhook verification
app.use('/webhook', express.raw({ type: 'application/json' }));
// Parse JSON for other routes
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Setup MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// -------------------- ROUTES -------------------- //

// Create order
const createOrder: RequestHandler = async (req, res) => {
  const { amount, currency = 'INR' } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `rcpt_${Date.now()}`,
      payment_capture: true,
    });

    await db.execute(
      'INSERT INTO razorpay_transactions (order_id, amount, currency) VALUES (?, ?, ?)',
      [order.id, order.amount, order.currency]
    );

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Verify payment
const verifyPayment: RequestHandler = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const status = expectedSig === razorpay_signature ? 'paid' : 'failed';

  await db.execute(
    'UPDATE razorpay_transactions SET payment_id=?, signature=?, status=? WHERE order_id=?',
    [razorpay_payment_id, razorpay_signature, status, razorpay_order_id]
  );

  if (status === 'failed') {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  return res.json({ success: true, orderId: razorpay_order_id });
};

// Webhook
const handleWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const payload = req.body as Buffer;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(payload)
    .digest('hex');

  if (expectedSig !== signature) {
    return res.status(400).end();
  }

  const event = JSON.parse(payload.toString());

  if (event.event === 'payment.captured') {
    const { order_id, payment_id } = event.payload.payment.entity;

    await db.execute(
      'UPDATE razorpay_transactions SET payment_id=?, status=? WHERE order_id=?',
      [payment_id, 'paid', order_id]
    );
  }

  return res.status(200).end();
};

// -------------------- REGISTER ROUTES -------------------- //

app.post('/create-order', createOrder);
app.post('/verify-payment', verifyPayment);
app.post('/webhook', handleWebhook);

// -------------------- START SERVER -------------------- //

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
