"use client";

import React, { useEffect, useState } from "react";
import { Icons } from "../icons";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (replace with actual page load detection in production)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-zervia-50 transition-opacity duration-500 ${
        !isLoading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative">
        {/* Outer circle */}
        <div className="w-20 h-20 border-4 border-zervia-200 rounded-full"></div>
        
        {/* Custom styled inner rotating element with expanding/contracting animation */}
        <div className="absolute top-0 left-0 w-20 h-20">
          <style jsx>{`
            @keyframes custom-preloader {
              0% {
                transform: rotate(0deg) scale(1);
              }
              25% {
                transform: rotate(90deg) scale(1.2);
              }
              50% {
                transform: rotate(180deg) scale(1);
              }
              75% {
                transform: rotate(270deg) scale(1.2);
              }
              100% {
                transform: rotate(360deg) scale(1);
              }
            }
            .custom-preloader {
              animation: custom-preloader 1.5s infinite ease-in-out;
            }
          `}</style>
          <div className="custom-preloader w-20 h-20 border-4 border-transparent border-t-zervia-500 rounded-full"></div>
        </div>
        
        {/* Logo in center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-zervia-500">
          <Icons.logo width={24} height={24} />
        </div>
        
        {/* Text below */}
        <p className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-zervia-600 font-medium tracking-wider animate-pulse-gentle">
          ZERVIA
        </p>
      </div>
    </div>
  );
} 