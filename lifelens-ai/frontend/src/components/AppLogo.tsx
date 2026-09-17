import React from 'react';

interface AppLogoProps {
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-sky-500/40 shadow-lg shadow-sky-500/25 shrink-0 bg-slate-900 ${className}`}>
      <img
        src="https://i.pinimg.com/736x/12/6d/e6/126de68d8ed57720d85c0bd2d56d40ba.jpg"
        alt="NEXORA AI Logo"
        className="w-full h-full object-cover"
        loading="eager"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};

