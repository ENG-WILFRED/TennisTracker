'use client';

import { useState } from 'react';
import { QRScanner, VerificationResult } from '@/components/qr/QRScanner';

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    setScanResult(decodedText);
    setIsVerifying(true);

    try {
      // Extract member ID and org ID from QR code URL
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const memberId = pathParts[pathParts.length - 1];
      const orgId = url.searchParams.get('org');

      if (!memberId || !orgId) {
        throw new Error('Invalid QR code format');
      }

      // Verify membership
      const response = await fetch(`/api/verify/${memberId}?org=${orgId}`);
      const result = await response.json();

      setVerificationResult(result);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        valid: false,
        error: 'Failed to verify membership'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
  };

  const resetScanner = () => {
    setScanResult(null);
    setVerificationResult(null);
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Membership Scanner</h1>
          <p className="text-gray-600">Scan QR codes on membership cards to verify validity</p>
        </div>

        {!verificationResult ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />

            {isVerifying && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-sky-50 border border-sky-200 rounded-lg">
                  <div className="animate-spin w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-sky-700 text-sm font-medium">Verifying membership...</span>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 break-all">{scanResult}</p>
              </div>
            )}
          </div>
        ) : (
          <VerificationResult
            result={verificationResult}
            onReset={resetScanner}
          />
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>For best results:</p>
          <ul className="mt-2 space-y-1">
            <li>• Ensure good lighting</li>
            <li>• Hold device steady</li>
            <li>• Keep QR code within the frame</li>
          </ul>
        </div>
      </div>
    </div>
  );
}