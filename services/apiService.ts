// Simulates calling a Node.js backend.
// In a real app, this would use fetch() or a library like axios to make HTTP requests.

import { it } from "node:test";

declare const axios: any;

const simulateApiCall = <T,>(data: T, delay = 1500): Promise<T> => {
  console.log('Simulating API call with data:', data);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

export const testPurchase = async () => {
    const res = await fetch("https://test-payment-facebook.onrender.com/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: "1.00",
        currency: "USD",
        items: [{ name: "Test Product", quantity: 1, price: "1.00" }],
      }),
    });

   // Open popup first (so browser doesn’t block)
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Popup blocked! Please allow popups for this site.");
    return;
  }
   const html = await res.text();

    // Inject HTML into popup
    newWindow.document.open();
    newWindow.document.write(html);
    newWindow.document.close();
};

export const generateKHQR = async () => {
   const res = await fetch("https://test-payment-facebook.onrender.com/api/khqr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: "1.00",
        currency: "USD",
        items: [{ name: "Test Product", quantity: 1, price: "1.00" }]
      }),
    });

    const data = await res.json();
    console.log('KHQR API Success Response:', data);
    return { success: true, message: 'KHQR payment request sent successfully! Check the console for the full API response.' };
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