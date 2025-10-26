
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Input from '../components/Input';
import { ICONS, CATEGORIES } from '../constants';
import { api } from '../services/api';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [code, setCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified || false);

  const [preferences, setPreferences] = useState<string[]>(user?.preferences || []);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);


  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    // Mock API call
    await new Promise(res => setTimeout(res, 1000));
    setVerificationSent(true);
    setIsVerifying(false);
  };
  
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    // Mock API call
    await new Promise(res => setTimeout(res, 1000));
    setPhoneVerified(true);
    setVerificationSent(false);
    setIsVerifying(false);
  };

  const handlePreferenceChange = (category: string) => {
    setPreferences(prev => 
      prev.includes(category) 
        ? prev.filter(p => p !== category) 
        : [...prev, category]
    );
    setPrefsSaved(false);
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
        const updatedUser = await api.updateUserPreferences(preferences);
        updateUser(updatedUser); // Update global user state
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 2000); // Hide message after 2s
    } catch (error) {
        console.error("Failed to save preferences", error);
    } finally {
        setIsSavingPrefs(false);
    }
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Profile</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Name</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{user.name}</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700"></div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700"></div>
        <div>
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">My Interests</h3>
           <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">Select categories you're interested in for a personalized homepage.</p>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(category => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={preferences.includes(category)}
                    onChange={() => handlePreferenceChange(category)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                </label>
              ))}
           </div>
           <div className="mt-4 flex items-center gap-4">
              <Button onClick={handleSavePreferences} isLoading={isSavingPrefs}>Save Preferences</Button>
              {prefsSaved && <span className="text-green-600 text-sm">Preferences saved!</span>}
           </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700"></div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Phone Verification</h3>
          {phoneVerified ? (
            <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
              {ICONS.checkCircle}
              <span>Your phone number is verified.</span>
            </div>
          ) : (
            <div className="mt-2 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Verify your phone number to increase trust and unlock more features.
              </p>
              {!verificationSent ? (
                <form onSubmit={handleSendCode} className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Input id="phone" label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1 (555) 123-4567" />
                  </div>
                  <Button type="submit" isLoading={isVerifying}>Send Code</Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Input id="code" label="Verification Code" type="text" value={code} onChange={e => setCode(e.target.value)} required placeholder="Enter 6-digit code" />
                  </div>
                  <Button type="submit" isLoading={isVerifying}>Verify</Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
