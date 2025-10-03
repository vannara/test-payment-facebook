import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { initiatePayment, verifyPushbackHash } from './utils/payway.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware

// Enhanced CORS setup for better security and flexibility
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3001', 'http://127.0.0.1:3001'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json()); // To parse JSON bodies

// Routes
app.get('/', (req, res) => {
  res.send('Payment Backend Server is running!');
});

app.post('/api/create-payment', async (req, res) => {
  const { paymentOption, amount, items } = req.body;

  if (!paymentOption || !amount || !items) {
    return res.status(400).json({ message: 'Payment option, amount, and items are required.' });
  }

  try {
    const paymentResponse = await initiatePayment(paymentOption, amount, items);
    res.status(200).json(paymentResponse);
  } catch (error) {
    console.error('Payment initiation failed:', error.message);
    res.status(500).json({ message: error.message || 'An internal server error occurred.' });
  }
});

// New route for PayWay pushback (webhook)
app.post('/api/payment-callback', (req, res) => {
    const pushbackData = req.body;
    console.log('Received PayWay Pushback:', pushbackData);

    const { tran_id, status, amount, merchant_id, hash } = pushbackData;

    if (!tran_id || !status || !amount || !merchant_id || !hash) {
        console.error('Incomplete pushback data received.');
        return res.status(400).json({ status: "1", message: "Bad Request: Missing required data." });
    }

    const isHashValid = verifyPushbackHash({ tran_id, status, amount, merchant_id }, hash);

    if (isHashValid) {
        console.log(`Hash verified for transaction ${tran_id}. Status: ${status}.`);
        // Here you would typically update the transaction status in your database.
        // For example: await database.updateTransaction(tran_id, { status: status });
        
        // Acknowledge receipt to PayWay is required.
        res.status(200).json({ status: "0", message: "Success" });
    } else {
        console.error(`Invalid hash for transaction ${tran_id}. Pushback from PayWay will be ignored.`);
        // Respond with an error status.
        res.status(400).json({ status: "1", message: "Hash mismatch." });
    }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
