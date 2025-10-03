// Simulates calling a Node.js backend.
// In a real app, this would use fetch() or a library like axios to make HTTP requests.

declare const axios: any;

// ===================================================================================
// IMPORTANT: CONFIGURATION REQUIRED
// ===================================================================================
// Replace the URL below with the actual URL of your backend deployed on Render.com.
// Your Render backend URL will look something like: https://your-app-name.onrender.com
//
// You MUST change this value for your local frontend to connect to the deployed backend.
// ===================================================================================
const API_BASE_URL = 'https://test-payment-facebook.onrender.com'; 

const simulateApiCall = <T,>(data: T, delay = 1500): Promise<T> => {
  console.log('Simulating API call with data:', data);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// --- NEW TYPE DEFINITIONS FOR PAYMENT FLOW ---

export interface CardPaymentPayload {
  req_time: string;
  tran_id: string;
  merchant_id: string;
  amount: string;
  items: string; // This is a JSON string
  payment_option: string;
  return_url: string;
  cancel_url: string;
  pushback_url: string;
  hash: string;
}

export type PaymentApiResponse = {
  type: 'form_redirect';
  payload: CardPaymentPayload;
  url: string;
} | {
  type: 'khqr';
  payload: { khqr_image?: string; };
};

export const createPayment = async (paymentOption: string, amount: string, items: any[]): Promise<PaymentApiResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/create-payment`, {
      paymentOption,
      amount,
      items,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.message || `API request failed with status ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      throw new Error('Network error: Could not connect to the backend server. Is the API_BASE_URL in apiService.ts correct and is the backend running?');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Setup Error:', error.message);
      throw new Error(error.message || 'An unknown error occurred while setting up the request.');
    }
  }
};

export const postToFacebook = async (postContent: string): Promise<{ success: boolean; message: string; postId: string }> => {
  if (!postContent.trim()) {
    throw new Error('Post content cannot be empty.');
  }
  await simulateApiCall({ action: 'postToFacebook', content: postContent });
  return { success: true, message: `Successfully posted to Facebook!`, postId: `fb_post_${Date.now()}` };
};

export const schedulePost = async (postContent: string, scheduleDate: string): Promise<{ success: boolean; message: string; scheduleId: string }> => {
  if (!postContent.trim() || !scheduleDate) {
    throw new Error('Post content and schedule date are required.');
  }
  await simulateApiCall({ action: 'schedulePost', content: postContent, date: scheduleDate });
  return { success: true, message: `Post scheduled for ${new Date(scheduleDate).toLocaleString()}`, scheduleId: `schedule_${Date.now()}` };
};