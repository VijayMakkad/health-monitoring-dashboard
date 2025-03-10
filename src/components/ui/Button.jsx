import React from "react";

const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 py-2 px-4 text-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };