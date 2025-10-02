// Simulates calling a Node.js backend.
// In a real app, this would use fetch() or a library like axios to make HTTP requests.

declare const axios: any;

const simulateApiCall = <T,>(data: T, delay = 1500): Promise<T> => {
  console.log('Simulating API call with data:', data);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

export const testKhqrPayment = async (): Promise<{ success: boolean; message:string }> => {
  const apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';

  // NOTE: These are placeholder values. In a real application,
  // the merchant ID would be a real value and the hash would be securely generated on the backend.
  const payload = {
    merchant_id: 'ec461963',
    req_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    tran_id: `demo_txn_${Date.now()}`,
    amount: "1.00",
    items: [{
        name: "Test Product",
        quantity: 1,
        price: "1.00"
    }],
    payment_option: "abapay_khqr"
  };

  try {
    console.log('Sending KHQR Payment Request with axios:', payload);
    const response = await axios.post(apiUrl, payload, {
        headers: {
            'Content-Type': 'application/json',
        }
    });

    const responseData = response.data;

    console.log('KHQR API Success Response:', responseData);
    return { success: true, message: 'KHQR payment request sent successfully! Check the console for the full API response.' };
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('KHQR API Error:', error.response.data);
      const errorMessage = error.response.data.description || `API request failed with status ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('KHQR Network Error:', error.request);
      throw new Error('Network error: No response received from the server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Failed to call KHQR payment API:', error.message);
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