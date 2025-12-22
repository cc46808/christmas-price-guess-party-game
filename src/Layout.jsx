import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  );
}