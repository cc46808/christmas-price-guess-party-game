import React from 'react';

// Simple QR Code generator using external API
export default function QRCode({ value, size = 200 }) {
  const encodedValue = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&bgcolor=ffffff&color=1a472a`;
  
  return (
    <div className="bg-white p-4 rounded-2xl shadow-xl inline-block">
      <img 
        src={qrUrl} 
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-lg"
      />
    </div>
  );
}