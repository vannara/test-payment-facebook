// Simulates calling a Node.js backend.
// In a real app, this would use fetch() or a library like axios to make HTTP requests.

declare const axios: any;
// Assumes the backend is running on port 4000
const API_BASE_URL = 'http://localhost:4000';


const simulateApiCall = <T,>(data: T, delay = 1500): Promise<T> => {
  console.log('Simulating API call with data:', data);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

export const createPayment = async (paymentOption: string, amount: string): Promise<{ checkout_link?: string; khqr_image?: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/create-payment`, {
      paymentOption,
      amount,
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
      throw new Error('Network error: Could not connect to the backend server.');
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
