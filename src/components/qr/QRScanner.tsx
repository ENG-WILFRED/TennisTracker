'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

export function QRScanner({ onScanSuccess, onScanError, className = '' }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import html5-qrcode to avoid SSR issues
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            setIsScanning(false);
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Only show errors if not scanning
            if (!isScanning) {
              setError(errorMessage);
              onScanError?.(errorMessage);
            }
          }
        );

        setIsScanning(true);
      }
    }).catch((err) => {
      setError('Failed to load QR scanner');
      console.error('QR Scanner load error:', err);
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess, onScanError, isScanning]);

  const toggleScanning = () => {
    if (scannerRef.current) {
      if (isScanning) {
        scannerRef.current.pause();
        setIsScanning(false);
      } else {
        scannerRef.current.resume();
        setIsScanning(true);
      }
    }
  };

  return (
    <div className={`qr-scanner ${className}`}>
      <div id="qr-reader" className="w-full max-w-md mx-auto" />

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <button
          onClick={toggleScanning}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isScanning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-sky-600 hover:bg-sky-700 text-white'
          }`}
        >
          {isScanning ? 'Pause Scanning' : 'Resume Scanning'}
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Position the QR code within the camera frame</p>
        <p>Make sure the code is well-lit and in focus</p>
      </div>
    </div>
  );
}

// Verification result component
interface VerificationResultProps {
  result: {
    valid: boolean;
    member?: {
      name: string;
      memberId: string;
      organization: string;
      expiryDate: string;
      isExpired: boolean;
    };
    verifiedAt: string;
  } | null;
  onReset: () => void;
}

export function VerificationResult({ result, onReset }: VerificationResultProps) {
  if (!result) return null;

  return (
    <div className="verification-result">
      {result.valid && result.member ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-900">Membership Verified</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{result.member.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member ID:</span>
              <span className="font-medium">{result.member.memberId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Organization:</span>
              <span className="font-medium">{result.member.organization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expires:</span>
              <span className={`font-medium ${result.member.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {result.member.expiryDate}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Verified at {new Date(result.verifiedAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900">Invalid Membership</h3>
          </div>

          <p className="text-gray-700">This membership card is not valid or has expired.</p>
        </div>
      )}

      <div className="mt-4 text-center">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Scan Another Code
        </button>
      </div>
    </div>
  );
}