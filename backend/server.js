// backend/server.js
import express from "express";
import axios from "axios";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors()); // allow frontend localhost
app.use(express.json());

app.post("/api/pay", async (req, res) => {
  try {
    const { amount, items } = req.body;

    const merchant_id = process.env.PAYWAY_MERCHANT_ID;
    const api_key = process.env.PAYWAY_API_KEY;

    const tran_id = `txn_${Date.now()}`;
    const req_time = new Date().toISOString().slice(0, 19).replace("T", " ");

    // generate hash (PayWay spec)
    const hash = crypto
      .createHash("sha512")
      .update(merchant_id + tran_id + amount + req_time + api_key)
      .digest("hex");

    const payload = {
      merchant_id,
      req_time,
      tran_id,
      amount,
      items,
      payment_option: "abapay_khqr",
      hash,
    };

    const apiUrl =
      "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

    const paywayRes = await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
    });

    res.json(paywayRes.data);
  } catch (err) {
    console.error("Payment API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment failed" });
  }
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

