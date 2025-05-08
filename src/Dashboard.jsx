import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { AlertTriangle, Droplet, HeartPulse, Waves, LogOut } from "lucide-react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext"
import "./Dashboard.css";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  // Fetch health data from database
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent health data records - adjust the limit as needed
      const { data: healthData, error } = await supabase
        .from('health_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Format the data for our dashboard with one decimal place
      const formattedData = healthData.map(record => ({
        id: record.id,
        time: new Date(record.timestamp).toLocaleTimeString(),
        timestamp: new Date(record.timestamp),
        heartRate: parseFloat(record.heart_rate).toFixed(1),
        spo2: parseFloat(record.spo2).toFixed(1),
        airQuality: parseFloat(record.air_quality).toFixed(1),
      }));
      
      // Sort data by timestamp
      formattedData.sort((a, b) => a.timestamp - b.timestamp);
      
      setData(formattedData);
      
      // Check for alert conditions on the latest data
      if (formattedData.length > 0) {
        checkAlertConditions(formattedData[formattedData.length - 1]);
      }
      
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({
            lat: position.coords.latitude.toFixed(1),
            lon: position.coords.longitude.toFixed(1),
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

    // Initial data fetch
    fetchHealthData();

    // Set up real-time subscription to the health_data table
    const subscription = supabase
      .channel('health_data_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'health_data' 
        }, 
        payload => {
          // Format the new record with one decimal place
          const newRecord = {
            id: payload.new.id,
            time: new Date(payload.new.timestamp).toLocaleTimeString(),
            timestamp: new Date(payload.new.timestamp),
            heartRate: parseFloat(payload.new.heart_rate).toFixed(1),
            spo2: parseFloat(payload.new.spo2).toFixed(1),
            airQuality: parseFloat(payload.new.air_quality).toFixed(1),
          };
          
          // Add to existing data
          setData(prev => {
            const newData = [...prev, newRecord].slice(-20); // Keep last 20 records
            return newData;
          });
          
          // Check for alert conditions
          checkAlertConditions(newRecord);
        }
      )
      .subscribe();

    // Create simulated data updates every second for live graphs and alerts
    const simulateDataInterval = setInterval(() => {
      const lastRecord = data.length > 0 ? data[data.length - 1] : {
        heartRate: 75,
        spo2: 96,
        airQuality: 50
      };
      
      // Occasionally create alert-triggering values
      const randomTrigger = Math.random();
      let heartRateChange = Math.random() * 2 - 1;
      let spo2Change = Math.random() * 0.6 - 0.3;
      let airQualityChange = Math.random() * 4 - 2;
      
      // 5% chance to generate a heart rate alert
      if (randomTrigger < 0.05) {
        heartRateChange = Math.random() < 0.5 ? -20 : 30; // Either too low or too high
      }
      
      // 3% chance to generate a SpO2 alert
      if (randomTrigger >= 0.05 && randomTrigger < 0.08) {
        spo2Change = -10; // Low oxygen
      }
      
      // 7% chance to generate an air quality alert
      if (randomTrigger >= 0.08 && randomTrigger < 0.15) {
        airQualityChange = 60; // Bad air quality
      }
      
      // Create a new record
      const simulatedRecord = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        timestamp: new Date(),
        heartRate: (parseFloat(lastRecord.heartRate) + heartRateChange).toFixed(1),
        spo2: (parseFloat(lastRecord.spo2) + spo2Change).toFixed(1),
        airQuality: (parseFloat(lastRecord.airQuality) + airQualityChange).toFixed(1),
      };
      
      // Add simulated record to data
      setData(prev => {
        const newData = [...prev, simulatedRecord].slice(-60); // Keep last 60 records (1 minute of data)
        return newData;
      });
      
      // Check alerts for simulated data
      checkAlertConditions(simulatedRecord);
      
    }, 1000); // Update every second
    
    // Set up polling for real data updates (as a backup if real-time subscription fails)
    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000); // Fetch every 30 seconds

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      clearInterval(simulateDataInterval);
    };
  }, []);

  // Check for alert conditions
  const checkAlertConditions = (newData) => {
    const newAlerts = [];
    
    // Heart rate alerts - outside 60-100 BPM range
    if (parseFloat(newData.heartRate) < 60) {
      newAlerts.push(`❤️ Bradycardia (${newData.heartRate} BPM) at ${newData.time}`);
    } else if (parseFloat(newData.heartRate) > 100) {
      newAlerts.push(`❤️ Tachycardia (${newData.heartRate} BPM) at ${newData.time}`);
    }
    
    // SpO2 alerts - below 90%
    if (parseFloat(newData.spo2) < 90) {
      newAlerts.push(`🌫️ Severe Hypoxia (SpO2 ${newData.spo2}%) at ${newData.time}`);
    }
    
    // AQI alerts - above 100 (lowered threshold for more alerts)
    if (parseFloat(newData.airQuality) > 100) {
      const category = getAQICategory(newData.airQuality);
      newAlerts.push(`☣️ ${category} Air Quality (${newData.airQuality} AQI) at ${newData.time}`);
    }
    
    if (newAlerts.length) {
      // Log the alert for debugging
      console.log("New alert triggered:", newAlerts);
      setAlerts(prev => [...newAlerts, ...prev]); // Put new alerts at the top
    }
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
        data: data.map(d => parseFloat(d.heartRate)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: '#ef4444',
        yAxisID: 'y',
      },
      {
        label: 'SpO2',
        data: data.map(d => parseFloat(d.spo2)),
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: '#60a5fa',
        yAxisID: 'y',
      },
      {
        label: 'Air Quality',
        data: data.map(d => parseFloat(d.airQuality)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: '#10b981',
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      tension: {
        duration: 500,
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
          },
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 10, // Limit number of x-axis labels to prevent crowding
        },
        grid: { 
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        }
      },
      y: { 
        position: 'left',
        min: 50,
        max: 120,
        title: {
          display: true,
          text: 'Heart Rate / SpO2',
          color: '#94a3b8',
          font: {
            size: 12,
          }
        },
        ticks: { 
          color: '#94a3b8',
          font: {
            size: 12,
          },
          callback: function(value) {
            return value.toFixed(1); // Display with one decimal
          }
        },
        grid: { 
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        }
      },
      y1: {
        position: 'right',
        min: 0,
        max: 500,
        title: {
          display: true,
          text: 'Air Quality Index',
          color: '#10b981',
          font: {
            size: 12,
          }
        },
        ticks: {
          color: '#10b981',
          font: {
            size: 12,
          },
          callback: function(value) {
            return value.toFixed(1); // Display with one decimal
          }
        },
        grid: {
          display: false,
        }
      }
    }
  };

  // AQI interpretation function
  const getAQICategory = (aqi) => {
    aqi = parseFloat(aqi);
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  return (
    <div className="dashboard">
      {/* Header with user info and signout */}
      <div className="dashboard-header">
        <div className="user-info">
          <div className="dashboard-title">Health Monitoring Dashboard</div>
          {user && (
            <div className="user-email">{user.email}</div>
          )}
        </div>
        <Button
          className="sign-out-button"
          onClick={signOut}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{ 
          gridColumn: "1 / -1", 
          display: "flex", 
          justifyContent: "center", 
          padding: "2rem" 
        }}>
          <div className="loading-spinner"></div>
        </div>
      )}

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
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - ((parseFloat(getCurrentReading('heartRate')) - 60) / 60))}`,
                    transition: 'stroke-dashoffset 0.5s ease-in-out'
                  }}
                />
                <text x="50" y="50" dy="0.35em" textAnchor="middle" className="gauge-text">
                  {getCurrentReading('heartRate')}
                </text>
                <text x="50" y="80" textAnchor="middle" className="gauge-unit">
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
              <p className="metric-note">
                {parseFloat(getCurrentReading('heartRate')) < 60 || parseFloat(getCurrentReading('heartRate')) > 100 ? 
                  <span style={{ color: '#fca5a5', fontSize: '0.75rem' }}>Outside normal range (60-100)</span> : 
                  <span style={{ color: '#86efac', fontSize: '0.75rem' }}>Normal range</span>}
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
            <h2 className="title">SpO2 and Air Quality</h2>
          </div>
          <div className="env-grid">
            <div className="env-column">
              <div className="env-box">
                <p className="env-label">SpO2 Level</p>
                <p className="env-value">
                  {getCurrentReading('spo2')}%
                </p>
                <p className="env-note">
                  {parseFloat(getCurrentReading('spo2')) < 90 ? 
                    <span style={{ color: '#fca5a5', fontSize: '0.75rem' }}>Critical: Below 90%</span> : 
                    <span style={{ color: '#86efac', fontSize: '0.75rem' }}>Normal</span>}
                </p>
              </div>
            </div>
            <div className="env-column">
              <div className="env-box">
                <p className="env-label">Air Quality</p>
                <p className="env-value">
                  {getCurrentReading('airQuality')} <span className="env-unit">AQI</span>
                </p>
                <p className="env-note">
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: parseFloat(getCurrentReading('airQuality')) > 100 ? '#fca5a5' : '#86efac' 
                  }}>
                    {getAQICategory(getCurrentReading('airQuality'))}
                  </span>
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
            {data.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                height: "100%" 
              }}>
                <p>No data available</p>
              </div>
            )}
          </div>
          <div className="chart-legend-custom">
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#ef4444'}}></span>
              <span className="legend-text">Heart Rate (60-100 normal)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#60a5fa'}}></span>
              <span className="legend-text">SpO2 (≥90% normal)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#10b981'}}></span>
              <span className="legend-text">AQI (≤100 acceptable)</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Button onClick={fetchHealthData}>
              Refresh Data
            </Button>
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
                {alerts.slice(0, 5).map((alert, i) => (
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
                    Last update: {data.length > 0 ? data[data.length-1].time : 'No data'}
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