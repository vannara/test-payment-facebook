import React, { useState } from 'react';
import * as api from './services/apiService';
import Card from './components/Card';
import Button from './components/Button';
import { PaymentIcon, FacebookIcon, CalendarIcon } from './components/icons';
import { ActionType } from './types';

const App: React.FC = () => {
  const [facebookPost, setFacebookPost] = useState('');
  const [scheduledPost, setScheduledPost] = useState('Hello this is a schedule post from nodejs app');
  const [scheduleDate, setScheduleDate] = useState('');

  const [loading, setLoading] = useState<ActionType | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApiCall = async (action: ActionType, apiFn: () => Promise<{message: string}>) => {
    setLoading(action);
    setFeedback(null);
    try {
      const result = await apiFn();
      setFeedback({ type: 'success', message: result.message });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(null);
    }
  };

  const handleTestKhqr = () => {
    handleApiCall(ActionType.KHQR, api.testKhqrPayment);
  };
  
  const handleGenerateKHQR = () => {
    handleApiCall(ActionType.KHQR, api.generateKHQR);
  }

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Backend Task Manager</h1>
          <p className="mt-2 text-lg text-gray-600">Simulating Node.js backend calls from a React frontend.</p>
        </header>

        {feedback && <FeedbackMessage />}

        <Card title="Payment Gateway" icon={<PaymentIcon />}>
          <p className="text-gray-600 text-sm">Click the button to send a test request to the KHQR payment sandbox environment.</p>
          <Button
            onClick={handleTestKhqr}
            isLoading={loading === ActionType.KHQR}
            variant="primary"
          >
            Test KHQR Payment Sandbox
          </Button>
          <Button
            onClick={handleGenerateKHQR}
            isLoading={loading === ActionType.KHQR}
            variant="secondary"
          >
            Test Generate QR Code
          </Button>
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