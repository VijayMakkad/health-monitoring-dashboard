import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { AlertTriangle, Droplet, HeartPulse, Waves, LogOut } from "lucide-react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { supabase, saveHealthData } from "./lib/supabase";
import { useAuth } from "./context/AuthContext"
import "./Dashboard.css";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const { user, signOut } = useAuth();

  // Generate mock environmental data
  const generateEnvData = () => ({
    time: new Date().toLocaleTimeString(),
    heartRate: Math.floor(Math.random() * (120 - 60) + 60),
    spo2: Math.floor(Math.random() * (100 - 90) + 90),
    airQuality: Math.floor(Math.random() * (500 - 50) + 50),
    temp: Math.floor(Math.random() * (40 - 34) + 34),
    humidity: Math.floor(Math.random() * (100 - 30) + 30),
    respiratoryRate: Math.floor(Math.random() * (40 - 12) + 12),
  });

  useEffect(() => {
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({
            lat: position.coords.latitude.toFixed(4),
            lon: position.coords.longitude.toFixed(4),
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation({ lat: "Not available", lon: "Not available" });
        }
      );
    } else {
      setLocation({ lat: "Not available", lon: "Not available" });
    }

    // Initialize with some data
    const initialData = [];
    for (let i = 0; i < 5; i++) {
      initialData.push(generateEnvData());
    }
    setData(initialData);

    const interval = setInterval(() => {
      const newData = generateEnvData();
      setData(prev => [...prev.slice(-20), newData]);
      
      // Check for alert conditions
      checkAlertConditions(newData);
      
      // Save data to Supabase if user is logged in
      if (user) {
        saveHealthData(user.id, newData).catch(error => {
          console.error("Failed to save health data:", error);
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  // Check for alert conditions
  const checkAlertConditions = (newData) => {
    const newAlerts = [];
    if (newData.heartRate > 110) newAlerts.push(`🚨 Tachycardia (${newData.heartRate} BPM) at ${newData.time}`);
    if (newData.spo2 < 92) newAlerts.push(`🌫️ Hypoxia (SpO2 ${newData.spo2}%) at ${newData.time}`);
    if (newData.airQuality > 300) newAlerts.push(`☣️ Poor Air Quality (${newData.airQuality} AQI) at ${newData.time}`);
    if (newData.temp > 38) newAlerts.push(`🔥 Elevated Temperature (${newData.temp}°C) at ${newData.time}`);
    
    if (newAlerts.length) setAlerts(prev => [...prev, ...newAlerts]);
  };

  // Get current readings
  const getCurrentReading = (metric) => {
    return data.length > 0 ? data[data.length-1][metric] : '--';
  };

  // Chart configuration
  const chartData = {
    labels: data.map(d => d.time),
    datasets: [
      {
        label: 'Heart Rate',
        data: data.map(d => d.heartRate),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#ef4444',
      },
      {
        label: 'SpO2',
        data: data.map(d => d.spo2),
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#60a5fa',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear',
      }
    },
    plugins: { 
      legend: { 
        labels: { 
          color: '#e2e8f0',
          font: {
            size: 14,
          }
        },
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        titleFont: {
          size: 16,
        },
        bodyFont: {
          size: 14,
        },
        padding: 12,
        cornerRadius: 6,
        displayColors: true,
      }
    },
    scales: { 
      x: { 
        ticks: { 
          color: '#94a3b8',
          font: {
            size: 12,
          }
        },
        grid: { 
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        }
      },
      y: { 
        min: 60,
        max: 120,
        ticks: { 
          color: '#94a3b8',
          font: {
            size: 12,
          }
        },
        grid: { 
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        }
      }
    }
  };

  return (
    <div className="dashboard">
      {/* Header with user info and signout */}
      <div className="col-span-4 flex justify-between items-center mb-4 px-4 py-2 bg-slate-800/50 rounded-lg shadow-md border border-slate-700">
        <div className="flex items-center">
          <div className="text-xl font-semibold text-white">Health Monitoring Dashboard</div>
          {user && (
            <div className="ml-4 text-sm text-slate-300">{user.email}</div>
          )}
        </div>
        <Button
          className="bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2"
          onClick={signOut}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>

      {/* Health Metrics Card */}
      <Card className="cardiac-metrics-card">
        <CardContent className="cardiac-content">
          <div className="header">
            <HeartPulse className="icon" size={28} />
            <h2 className="title">Cardiac Metrics</h2>
          </div>

          <div className="gauge-container">
            <div className="gauge">
              <svg className="gauge-svg" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                  className="gauge-bg"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="gauge-progress"
                  transform="rotate(-90 50 50)"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}`,
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - ((getCurrentReading('heartRate') - 60) / 60))}`,
                    transition: 'stroke-dashoffset 0.5s ease-in-out'
                  }}
                />
                <text x="50" y="50" dy="0.35em" textAnchor="middle" className="gauge-text">
                  {getCurrentReading('heartRate')}
                </text>
                <text x="50" y="65" textAnchor="middle" className="gauge-unit">
                  BPM
                </text>
              </svg>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-box">
              <p className="metric-label">Heart Rate</p>
              <p className="metric-value">
                {getCurrentReading('heartRate')} <span className="metric-unit">BPM</span>
              </p>
            </div>
            <div className="metric-box">
              <p className="metric-label">Resp. Rate</p>
              <p className="metric-value">
                {getCurrentReading('respiratoryRate')} <span className="metric-unit">BPM</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Oxygen & Environment Card */}
      <Card className="oxygen-environment-card">
        <CardContent className="oxygen-content">
          <div className="header">
            <Droplet className="icon" size={28} />
            <h2 className="title">Oxygen & Environment</h2>
          </div>
          <div className="env-grid">
            <div className="env-column">
              <div className="env-box">
                <p className="env-label">SpO2 Level</p>
                <p className="env-value">
                  {getCurrentReading('spo2')}%
                </p>
              </div>
              <div className="env-box">
                <p className="env-label">Humidity</p>
                <p className="env-value">
                  {getCurrentReading('humidity')}%
                </p>
              </div>
            </div>
            <div className="env-column">
              <div className="env-box">
                <p className="env-label">Air Quality</p>
                <p className="env-value">
                  {getCurrentReading('airQuality')} <span className="env-unit">AQI</span>
                </p>
              </div>
              <div className="env-box">
                <p className="env-label">Temperature</p>
                <p className="env-value">
                  {getCurrentReading('temp')}°C
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Trends Chart */}
      <Card className="trends-card">
        <CardContent className="trends-content">
          <div className="header">
            <Waves className="icon" size={28} />
            <h2 className="title">Vital Signs Trends</h2>
          </div>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Location Panel */}
      <Card className="alerts-card">
        <CardContent className="alerts-content">
          <div className="alerts-header">
            <div className="header">
              <AlertTriangle className="icon" size={28} />
              <h2 className="title">Alerts & Location</h2>
            </div>
            <Button 
              className="clear-button"
              onClick={() => setAlerts([])}
            >
              Clear Alerts
            </Button>
          </div>
          
          <div className="alerts-grid">
            <div className="alerts-container">
              <h3 className="section-title">Recent Alerts</h3>
              <div className="alerts-list">
                {alerts.slice(-3).map((alert, i) => (
                  <div key={i} className="alert-item">
                    <p className="alert-text">{alert}</p>
                  </div>
                ))}
                {!alerts.length && (
                  <div className="no-alerts">
                    <p className="no-alerts-text">No active alerts</p>
                    <p className="monitoring-text">System monitoring is active</p>
                  </div>
                )}
              </div>
            </div>

            <div className="location-container">
              <h3 className="section-title">Location Data</h3>
              <div className="location-info">
                <div className="location-item">
                  <p className="location-label">Latitude</p>
                  <p className="location-value">
                    🌍 {location.lat || 'Loading...'}
                  </p>
                </div>
                <div className="location-item">
                  <p className="location-label">Longitude</p>
                  <p className="location-value">
                    🌎 {location.lon || 'Loading...'}
                  </p>
                </div>
                <div className="timestamp">
                  <p className="timestamp-text">
                    Last update: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;