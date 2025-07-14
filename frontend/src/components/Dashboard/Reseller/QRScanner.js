import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';

const QRScanner = ({ onScan, onError, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line
  }, [scanning]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setPermission('granted');
        startScanning();
      }
    } catch (err) {
      setPermission('denied');
      setError('Camera access denied.');
      if (onError) onError('Camera access denied.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const startScanning = () => {
    intervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        stopCamera();
        setScanning(false);
        if (onScan) onScan(code.data);
      }
    }, 200);
  };

  const handleStart = () => setScanning(true);
  const handleClose = () => {
    stopCamera();
    setScanning(false);
    if (onClose) onClose();
  };

  return (
    <div className="p-4">
      {!scanning && (
        <button onClick={handleStart} className="px-4 py-2 bg-blue-500 text-white rounded">Start QR Scan</button>
      )}
      {scanning && (
        <div className="relative">
          <video ref={videoRef} className="w-full border-2 border-dashed border-blue-400" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <button onClick={handleClose} className="absolute top-2 right-2 px-2 py-1 bg-gray-200">Close</button>
        </div>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {permission === 'denied' && <div className="text-red-500">Camera permission denied.</div>}
    </div>
  );
};

export default QRScanner; 