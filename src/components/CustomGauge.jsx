import React from "react";
import "./CustomGauge.css";

const CustomGauge = ({ 
  value, 
  min = 0, 
  max = 100, 
  label, 
  unit = "", 
  size = "medium", 
  color = "blue" 
}) => {
  // Calculate percentage for gauge fill
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  // Calculate the stroke dash array and offset
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Determine size and color classes
  const sizeClass = `gauge-${size}`;
  const textSizeClass = `gauge-text-${size}`;
  const labelSizeClass = `gauge-label-${size}`;
  const colorClass = `gauge-color-${color}`;
  
  return (
    <div className="gauge-component">
      {label && <div className={`gauge-label ${labelSizeClass}`}>{label}</div>}
      <div className={`gauge-container ${sizeClass}`}>
        {/* Background circle */}
        <svg className="gauge-svg" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            className={`gauge-background gauge-bg-${color}`}
          />
          
          {/* Foreground circle that shows the value */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className={`gauge-progress gauge-progress-${color}`}
            style={{
              strokeDasharray: strokeDasharray,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
        </svg>
        
        {/* Value in the center */}
        <div className="gauge-value-container">
          <span className={`gauge-value ${textSizeClass} gauge-text-${color}`}>
            {Math.round(value)}
          </span>
          {unit && <span className="gauge-unit-text">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default CustomGauge;