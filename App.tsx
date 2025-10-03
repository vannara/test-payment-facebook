import React, { useState } from 'react';
import * as api from './services/apiService';
import Card from './components/Card';
import Button from './components/Button';
import { PaymentIcon, FacebookIcon, CalendarIcon, CreditCardIcon } from './components/icons';
import { ActionType } from './types';

/**
 * Creates and submits a hidden form to perform a POST redirect.
 * This is the standard method for redirecting to a payment gateway
 * without running into CORS issues.
 * @param url The URL to post the form to.
 * @param data The data to include in the form as hidden fields.
 */
const performRedirect = (url: string, data: { [key: string]: string }) => {
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.style.display = 'none'; // Hide the form from the user

    // Add data as hidden input fields
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
        }
    }

    // Append the form to the body, submit it, and then remove it.
    // The submission will trigger a page navigation.
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};


const App: React.FC = () => {
  const [facebookPost, setFacebookPost] = useState('');
  const [scheduledPost, setScheduledPost] = useState('Hello this is a schedule post from nodejs app');
  const [scheduleDate, setScheduleDate] = useState('');
  
  const [paymentOption, setPaymentOption] = useState<'credit_card' | 'khqr' | null>(null);
  const [amount, setAmount] = useState('1.00');
  const [khqrImage, setKhqrImage] = useState<string | null>(null);

  const [loading, setLoading] = useState<ActionType | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApiCall = async (action: ActionType, apiFn: () => Promise<api.PaymentApiResponse | any>) => {
    setLoading(action);
    setFeedback(null);
    let isRedirecting = false; // Flag to prevent resetting loading state on redirect

    try {
      const result = await apiFn();
      if (action === ActionType.Payment) {
        // Handle the new response structure from our backend
        if (result.type === 'form_redirect') {
            setFeedback({ type: 'success', message: 'Redirecting to secure payment page...' });
            isRedirecting = true;
            // A short delay gives the user time to see the feedback message
            setTimeout(() => performRedirect(result.url, result.payload), 500);
            return; // Stop execution to allow for redirect
        } else if (result.type === 'khqr' && result.payload.khqr_image) {
            setFeedback({ type: 'success', message: 'QR Code generated successfully.' });
            setKhqrImage(`data:image/png;base64,${result.payload.khqr_image}`);
        } else {
            console.error('Unexpected payment API response:', result);
            setFeedback({ type: 'error', message: 'Received an unexpected response from the payment server.' });
        }
      } else {
         setFeedback({ type: 'success', message: result.message });
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'An unexpected error occurred.' });
    } finally {
      // Only reset loading state if we are not navigating away
      if (!isRedirecting) {
        setLoading(null);
      }
    }
  };

  const handlePayment = () => {
    if (!paymentOption || !amount) return;
    const paymentMethod = paymentOption === 'khqr' ? 'abapay_khqr' : 'cards';
    
    // Create a sample items array to send to the backend
    const items = [{
        name: "Sample Item",
        quantity: 1,
        price: parseFloat(amount)
    }];

    handleApiCall(ActionType.Payment, () => api.createPayment(paymentMethod, amount, items));
  };
  
  const handleFacebookPost = () => {
    handleApiCall(ActionType.Facebook, () => api.postToFacebook(facebookPost));
  };

  const handleSchedulePost = () => {
    handleApiCall(ActionType.Schedule, () => api.schedulePost(scheduledPost, scheduleDate));
  };
  
  const FeedbackMessage: React.FC = () => {
    if (!feedback) return null;
    const baseClasses = 'my-4 text-center p-3 rounded-lg text-sm transition-opacity duration-300';
    const typeClasses = feedback.type === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
    return <div className={`${baseClasses} ${typeClasses}`}>{feedback.message}</div>;
  };

  const PaymentOptionButton: React.FC<{ type: 'credit_card' | 'khqr'; label: string; icon: React.ReactNode }> = ({ type, label, icon }) => {
    const isSelected = paymentOption === type;
    return (
      <button
        onClick={() => setPaymentOption(type)}
        className={`w-full p-4 border-2 rounded-lg flex items-center gap-4 transition-all duration-200 ${
          isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-300 bg-white hover:border-indigo-400'
        }`}
      >
        <div className={`p-2 rounded-full ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>{icon}</div>
        <span className={`font-semibold ${isSelected ? 'text-indigo-800' : 'text-gray-700'}`}>{label}</span>
      </button>
    );
  };

  const KhqrModal: React.FC = () => {
    if (!khqrImage) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setKhqrImage(null)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Scan to Pay</h3>
                <p className="text-gray-600 mb-4">Use your banking app to scan this KHQR code.</p>
                <img src={khqrImage} alt="KHQR Code" className="mx-auto rounded-lg border-4 border-gray-100" />
                <button 
                  onClick={() => setKhqrImage(null)} 
                  className="mt-6 w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {khqrImage && <KhqrModal />}
      <div className="w-full max-w-lg space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Backend Task Manager</h1>
          <p className="mt-2 text-lg text-gray-600">Simulating Node.js backend calls from a React frontend.</p>
        </header>

        {feedback && <FeedbackMessage />}

        <Card title="Payment Gateway" icon={<PaymentIcon />}>
            <div className='space-y-4'>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="1.00"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PaymentOptionButton type="credit_card" label="Credit / Debit Card" icon={<CreditCardIcon />} />
                    <PaymentOptionButton type="khqr" label="ABA KHQR" icon={<PaymentIcon />} />
                </div>
                <Button
                    onClick={handlePayment}
                    isLoading={loading === ActionType.Payment}
                    disabled={!paymentOption || !amount}
                    variant="primary"
                >
                    Proceed to Pay ${amount}
                </Button>
            </div>
        </Card>

        <Card title="Facebook Poster" icon={<FacebookIcon />}>
          <textarea
            value={facebookPost}
            onChange={(e) => setFacebookPost(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            rows={3}
          />
          <Button
            onClick={handleFacebookPost}
            isLoading={loading === ActionType.Facebook}
            disabled={!facebookPost.trim()}
            variant="secondary"
          >
            Post to Facebook
          </Button>
        </Card>

        <Card title="Content Scheduler" icon={<CalendarIcon />}>
          <textarea
            value={scheduledPost}
            onChange={(e) => setScheduledPost(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            rows={3}
          />
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
          />
          <Button
            onClick={handleSchedulePost}
            isLoading={loading === ActionType.Schedule}
            disabled={!scheduledPost.trim() || !scheduleDate}
            variant="dark"
          >
            Schedule Post
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default App;