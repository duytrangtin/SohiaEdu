import React from 'react';
import { playClickSound } from '../services/soundService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  onClick,
  ...props 
}) => {
  
  const baseStyles = "font-bold py-3 px-6 rounded-xl border-2 border-black transition-all active:translate-y-1 active:shadow-none text-sm sm:text-base select-none";
  
  const variants = {
    primary: "bg-black text-white shadow-hard hover:bg-gray-800",
    secondary: "bg-white text-black shadow-hard hover:bg-gray-100",
    outline: "bg-transparent text-black border-black hover:bg-gray-100"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClickSound();
    if (onClick) onClick(e);
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;