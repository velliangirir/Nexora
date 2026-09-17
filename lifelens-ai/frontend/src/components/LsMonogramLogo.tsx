import React from 'react';
import { AppLogo } from './AppLogo';

interface LsMonogramLogoProps {
  className?: string;
  size?: number;
}

export const LsMonogramLogo: React.FC<LsMonogramLogoProps> = ({ className = "w-10 h-10" }) => {
  return <AppLogo className={className} />;
};



