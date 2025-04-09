import React from "react";
import { useTheme } from "@/components/AppShell";

interface LogoProps {
  variant?: "full" | "icon" | "icon-negative";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Agent Launch Logo Component
 * 
 * Renders the Agent Launch logo in different variants and sizes
 * Dynamically switches between light and dark mode logos
 */
export function Logo({ 
  variant = "full", 
  className = "", 
  size = "md" 
}: LogoProps) {
  const { darkMode } = useTheme();
  
  // Define consistent dimensions for each size
  const dimensions = {
    sm: variant === "full" ? { width: 300, height: 100 } : { width: 100, height: 100 },
    md: variant === "full" ? { width: 400, height: 130 } : { width: 130, height: 130 },
    lg: variant === "full" ? { width: 500, height: 163 } : { width: 163, height: 163 },
    xl: variant === "full" ? { width: 600, height: 195 } : { width: 195, height: 195 },
  };

  const { width, height } = dimensions[size];
  
  const logoClasses = `${className} transition-all duration-300 filter hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] object-contain`;
  
  // Full logo with text
  if (variant === "full") {
    return (
      <img 
        src={darkMode ? "/static/big-logo-dark.jpg" : "/static/big-logo.jpg"} 
        alt="Agent Launch" 
        width={width}
        height={height}
        className={logoClasses}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    );
  }
  
  // Icon only
  if (variant === "icon") {
    return (
      <img 
        src={darkMode ? "/static/small-logo-dark.jpg" : "/static/small-logo.jpg"} 
        alt="Agent Launch Icon" 
        width={width}
        height={height}
        className={logoClasses}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    );
  }
  
  // Icon with inverted colors (white icon on black background)
  return (
    <div 
      className={`bg-black p-2 rounded flex items-center justify-center ${className}`}
      style={{ width: `${width + 16}px`, height: `${height + 16}px` }}
    >
      <img 
        src={darkMode ? "/static/small-logo-dark.jpg" : "/static/small-logo.jpg"} 
        alt="Agent Launch Icon" 
        width={width}
        height={height}
        className={`${logoClasses} h-auto w-auto`}
      />
    </div>
  );
} 