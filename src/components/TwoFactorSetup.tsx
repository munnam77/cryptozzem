import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import QRCode from 'qrcode.react';

export function TwoFactorSetup() {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  
  const { setup2FA, verify2FA, disable2FA, is2FAEnabled } = useAuth();

  const handleSetup = async () => {
    try {
      setIsSettingUp(true);
      setError(null);
      const { qrCode: setupQR, backupCodes: codes } = await setup2FA();
      setQRCode(setupQR);
      setBackupCodes(codes);
    } catch (err) {
      setError('Failed to setup 2FA. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Please enter verification code');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      const verified = await verify2FA(verificationCode);
      if (!verified) {
        setError('Invalid verification code');
        return;
      }
      // Reset state after successful verification
      setQRCode(null);
      setBackupCodes([]);
      setVerificationCode('');
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA?')) {
      return;
    }

    try {
      setIsDisabling(true);
      setError(null);
      await disable2FA(verificationCode);
      setVerificationCode('');
    } catch (err) {
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setIsDisabling(false);
    }
  };

  if (isSettingUp || isVerifying || isDisabling) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Two-Factor Authentication
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {!is2FAEnabled && !qrCode && (
        <button
          onClick={handleSetup}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Setup Two-Factor Authentication
        </button>
      )}

      {qrCode && (
        <div className="space-y-6">
          <div className="text-center">
            <QRCode value={qrCode} size={200} />
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <h3 className="font-bold mb-2">Backup Codes</h3>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
              Save these backup codes in a secure place. You can use them to access your account if you lose your 2FA device.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Verify and Enable
            </button>
          </form>
        </div>
      )}

      {is2FAEnabled && (
        <div className="space-y-4">
          <div className="p-3 bg-green-100 text-green-700 rounded">
            Two-factor authentication is enabled
          </div>
          <form onSubmit={handleDisable} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Current 2FA Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            <button
              type="button"
              onClick={handleDisable}
              className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Disable 2FA
            </button>
          </form>
        </div>
      )}
    </div>
  );
}