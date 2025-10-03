import crypto from 'crypto';
import axios from 'axios';

export const PAYWAY_API_URL = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';
const MERCHANT_ID = process.env.MERCHANT_ID;
const API_KEY = process.env.API_KEY;
const BACKEND_URL = process.env.BACKEND_URL; // e.g., 'https://your-backend.com'
const FRONTEND_URL = process.env.FRONTEND_URL; // e.g., 'https://your-frontend.com'


/**
 * Generates the HMAC-SHA512 hash required by the PayWay API.
 * @param {string} message The concatenated string of transaction details.
 * @returns {string} The Base64 encoded hash.
 */
function generateHash(message) {
  const hmac = crypto.createHmac('sha512', API_KEY);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Generates a more robust transaction ID in the format YYYYMMDDHHMMSSsss.
 * @returns {string} A unique transaction ID.
 */
function generateTransactionId() {
    const d = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${YYYY}${MM}${DD}${HH}${mm}${ss}${randomSuffix}`;
}

/**
 * Initiates a payment request to the PayWay API for any payment method.
 * @param {string} paymentOption The payment method ('cards', 'abapay_khqr', etc.).
 * @param {string} amount The transaction amount.
 * @param {Array} items The list of items for the transaction.
 * @returns {Promise<object>} A classified response from the PayWay API.
 */
export async function initiatePayment(paymentOption, amount, items) {
  if (!MERCHANT_ID || !API_KEY) {
    throw new Error('Merchant ID or API Key is not configured in environment variables.');
  }

  const req_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const tran_id = generateTransactionId();
  const itemsString = JSON.stringify(items);
  const formattedAmount = parseFloat(amount).toFixed(2);

  const hashString = `${req_time}${tran_id}${MERCHANT_ID}${formattedAmount}${itemsString}${paymentOption}`;
  const hash = generateHash(hashString);

  const backendUrl = BACKEND_URL || 'http://localhost:4000';
  const frontendUrl = FRONTEND_URL || 'http://localhost:3001';

  const payload = {
    req_time,
    tran_id,
    merchant_id: MERCHANT_ID,
    amount: formattedAmount,
    items, // For API call, send as a JSON object, axios handles stringification
    payment_option: paymentOption,
    return_url: `${frontendUrl}/payment-success?tran_id=${tran_id}`,
    cancel_url: `${frontendUrl}/payment-cancel`,
    pushback_url: `${backendUrl}/api/payment-callback`,
    hash,
  };

  try {
    const response = await axios.post(PAYWAY_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Intelligently determine the response type
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
        return { type: 'html', data: response.data };
    } else {
        // Assume JSON for KHQR or any other non-HTML responses
        return { type: 'json', data: response.data };
    }

  } catch (error) {
    if (error.response) {
      console.error('PayWay API Error Response:', error.response.data);
      // If the error response is HTML, it might contain useful info
      if (typeof error.response.data === 'string' && error.response.data.toLowerCase().includes('unable to process')) {
          throw new Error('The payment gateway was unable to process the request. Please check transaction details.');
      }
      const errorMessage = error.response.data.description || `PayWay API request failed with status ${error.response.status}`;
      throw new Error(errorMessage);
    } else {
      console.error('Failed to call PayWay API:', error.message);
      throw new Error('Could not connect to the payment gateway.');
    }
  }
}

/**
 * Verifies the pushback hash from PayWay.
 * @param {object} pushbackData The data received from the PayWay pushback.
 * @param {string} pushbackData.tran_id
 * @param {string} pushbackData.merchant_id
 * @param {string} pushbackData.status
 * @param {string} pushbackData.amount
 * @param {string} receivedHash The hash received in the pushback request.
 * @returns {boolean} True if the hash is valid, false otherwise.
 */
export function verifyPushbackHash({ tran_id, merchant_id, status, amount }, receivedHash) {
    if (!MERCHANT_ID || !API_KEY) {
        console.error('Merchant ID or API Key is not configured for pushback verification.');
        return false;
    }

    if (merchant_id !== MERCHANT_ID) {
        console.error(`Mismatched Merchant ID in pushback. Expected ${MERCHANT_ID}, got ${merchant_id}.`);
        return false;
    }
    
    // As per PayWay docs, hash is on: tran_id + merchant_id + status + amount
    const hashString = `${tran_id}${merchant_id}${status}${amount}`;
    const expectedHash = generateHash(hashString);

    const isValid = expectedHash === receivedHash;
    if (!isValid) {
        console.error(`Hash mismatch for tran_id ${tran_id}. Expected: ${expectedHash}, Received: ${receivedHash}`);
    }
    return isValid;
}