import React from "react";
import "./Card.css";

const Card = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`card ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`card-content ${className}`} {...props}>
      {children}
    </div>
  );
};

export { Card, CardContent };