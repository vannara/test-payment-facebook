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
    const amount = req.body.amount;
    const items = Buffer.from(req.body.items).toString('base64');
    const currency = req.body.currency || "USD";
    const merchant_id = process.env.payway_merchant_id;

    const tran_id = `txn_${Date.now()}`;
    const req_time = new Date().toISOString().slice(0, 19).replace("T", " ");
    // generate hash (PayWay spec)
    const hash = crypto
      .createHash("sha512")
      .update(merchant_id + tran_id + items + amount + req_time)
      .digest("base64");

    const payload = {
      merchant_id,
      req_time,
      tran_id,
      amount,
      currency,
      items,
      hash,
      view_type: popup,
      lifetime: 5
    };

    const apiUrl =
      "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

    const paywayRes = await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
    });

    res.json(paywayRes.data);
  } catch (err) {
    console.error("Payment API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment failed", details: err.response?.data || err.message });
  }
});
app.post("/api/khqr", async (req, res) => {
  try {
    const amount = req.body.amount;
    const items = Buffer.from(req.body.items).toString('base64');
    const merchant_id = process.env.payway_merchant_id;
    const currency = req.body.currency || "USD";
    const tran_id = `txn_qr_${Date.now()}`;
    const req_time = new Date().toISOString().slice(0, 19).replace("T", " ");
    // generate hash (PayWay spec)
    const hash = crypto
      .createHash("sha512")
      .update(merchant_id + tran_id + amount + req_time)
      .digest("base64");

    const payload = {
      merchant_id,
      req_time,
      tran_id,
      amount,
      currency,
      items,
      payment_option: "abapay_khqr",
      hash,
      lifetime: 5, // minutes
      qr_image_template: "template5_color",
    };

    const apiUrl =
      "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/generate-qr";

    const paywayRes = await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
    });

    res.json(paywayRes.data);
  } catch (err) {
    console.error("Payment API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment failed", details: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

