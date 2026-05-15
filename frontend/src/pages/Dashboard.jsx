import { useState, useEffect } from 'react';
import { useSensors } from '../hooks/useSensors';
import EmergencyModal from '../components/EmergencyModal';
import { io } from 'socket.io-client';
import { Shield, ShieldAlert, Activity, Navigation, Smartphone, Settings, Clock, History, Phone, Hospital } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for leaflet markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25,41],
    iconAnchor: [12,41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const hospitalIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2966/2966473.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], 14);
    }
  }, [center, map]);
  return null;
}

export default function Dashboard() {
  const { startMonitoring, stopMonitoring, isMonitoring, motionData, speed, location, checkAccident } = useSensors();
  const [modalOpen, setModalOpen] = useState(false);
  const [incidentData, setIncidentData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  // Settings
  const [settings, setSettings] = useState({
    impactThreshold: 4.0,
    countdownDuration: 60,
    isSettingsOpen: false
  });

  useEffect(() => {
    const socket = io('http://localhost:5000');
    fetchLogs();
    fetchProfile();

    if ("Notification" in window) {
      Notification.requestPermission();
    }

    socket.on('new_incident', (data) => {
      setIncidentData(data);
      setLogs(prev => [data, ...prev].slice(0, 20));
      showNotification("Emergency Alert", "Emergency services have been notified.");
    });
    
    return () => socket.disconnect();
  }, []);

  const showNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  // Real detection loop
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        if (checkAccident()) {
          triggerAccident();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, checkAccident]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/incidents');
      const data = await res.json();
      setLogs(data);
    } catch (err) {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      if (data.length > 0) setUserProfile(data[0]);
    } catch (err) {}
  };

  const triggerAccident = () => {
    setModalOpen(true);
  };

  const handleSafe = () => {
    setModalOpen(false);
  };

  const handleTimeout = async () => {
    setModalOpen(false);
    try {
      const response = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?._id,
          location: location || { lat: 28.704060, lng: 77.102493 },
          timestamp: new Date().toISOString(),
          status: 'critical'
        })
      });
      const data = await response.json();
      fetchLogs();
    } catch (err) {}
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Hero / Header */}
      <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full group-hover:bg-red-600/20 transition-all duration-700"></div>
          
          <div className="relative z-10 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tighter text-gradient">
              LifeSaver <span className="text-red-500 animate-pulse">AI</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md">Smart Accident Detection and Instant Emergency Assistance</p>
          </div>

        <div className="relative z-10 flex flex-col sm:flex-row w-full md:w-auto gap-4">
          <button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`flex-1 md:flex-none px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${isMonitoring ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-blue-600 text-white shadow-blue-600/30'}`}
          >
            {isMonitoring ? <div className="w-3 h-3 bg-white rounded-full animate-ping"/> : <Shield className="w-6 h-6"/>}
            <span>{isMonitoring ? 'Monitoring Active' : 'Start Monitoring'}</span>
          </button>
          
          <button 
            onClick={triggerAccident}
            className="px-6 py-5 rounded-2xl bg-slate-800/80 text-slate-300 hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-white/5 flex items-center justify-center gap-2"
            title="Simulate Accident"
          >
            <Activity className="w-5 h-5" />
            <span className="font-bold">Test Impact</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sensors & Logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sensors Card */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-400"/> Live Sensors</h3>
              <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isMonitoring ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-700 text-slate-500'}`}>
                {isMonitoring ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-900/60 backdrop-blur-lg rounded-3xl p-6 border border-white/5 hover:border-blue-500/30 transition-all shadow-inner">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Velocity</div>
                  <Navigation className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white tracking-tighter">{Math.round(speed)}</span>
                  <span className="text-slate-500 font-bold text-sm">KM/H</span>
                </div>
                <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(speed, 100)}%` }} />
                </div>
              </div>
              
              <div className="bg-slate-900/60 backdrop-blur-lg rounded-3xl p-6 border border-white/5 hover:border-red-500/30 transition-all shadow-inner">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Force Magnitude</div>
                  <Activity className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-red-500 tracking-tighter">{motionData.currentG.toFixed(1)}</span>
                  <span className="text-slate-500 font-bold text-sm">G-FORCE</span>
                </div>
                <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300" 
                    style={{ width: `${Math.min(motionData.currentG * 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Settings */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400"/> Emergency Settings</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                  <span>Impact Threshold</span>
                  <span className="text-purple-400">{settings.impactThreshold} G</span>
                </div>
                <input 
                  type="range" min="2" max="10" step="0.5" 
                  value={settings.impactThreshold}
                  onChange={(e) => setSettings({...settings, impactThreshold: parseFloat(e.target.value)})}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                  <span>Countdown Timer</span>
                  <span className="text-purple-400">{settings.countdownDuration}s</span>
                </div>
                <input 
                  type="range" min="10" max="120" step="10" 
                  value={settings.countdownDuration}
                  onChange={(e) => setSettings({...settings, countdownDuration: parseInt(e.target.value)})}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Incident Log */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><History className="w-5 h-5 text-amber-400"/> Incident Log</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-sm italic text-center py-10 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">No incidents recorded</div>
              ) : (
                logs.map((log) => (
                  <div key={log._id} className="bg-slate-900/50 border border-slate-700/50 rounded-[1.5rem] p-5 transition hover:bg-slate-900 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Incident Logged</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="text-white text-sm font-black mb-1 flex items-center gap-2">
                      <Hospital className="w-4 h-4 text-green-400" />
                      {log.hospital?.name || 'Searching Hospital...'}
                    </div>
                    <div className="text-slate-500 text-[10px] ml-6 mb-4">{log.hospital?.address}</div>
                    
                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                       <div title="SMS Sent" className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                         <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                       </div>
                       <div title="Call Placed" className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                         <Phone className="w-3.5 h-3.5 text-purple-500" />
                       </div>
                       <div title="Location Shared" className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                         <Navigation className="w-3.5 h-3.5 text-green-500" />
                       </div>
                       <div className="ml-auto text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                         {log.hospital?.distance} KM
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Map */}
        <div className="lg:col-span-8 bg-slate-800/40 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2"><Navigation className="w-6 h-6 text-green-400"/> Live Emergency Tracking</h3>
            {incidentData && (
              <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black animate-pulse flex items-center gap-2">
                <Activity className="w-4 h-4"/> EMERGENCY ACTIVE
              </div>
            )}
          </div>
          <div className="flex-1 relative min-h-[600px] z-10">
            <MapContainer 
              center={location || { lat: 28.704060, lng: 77.102493 }} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {location && (
                <>
                  <MapUpdater center={location} />
                  <Marker position={[location.lat, location.lng]}>
                    <Popup>Your Location</Popup>
                  </Marker>
                </>
              )}
              {incidentData?.hospital && (
                <>
                  <Marker 
                    position={[incidentData.hospital.coordinates.lat, incidentData.hospital.coordinates.lng]}
                    icon={hospitalIcon}
                  >
                    <Popup>{incidentData.hospital.name}</Popup>
                  </Marker>
                  <Polyline 
                    positions={[
                      [location.lat, location.lng],
                      [incidentData.hospital.coordinates.lat, incidentData.hospital.coordinates.lng]
                    ]}
                    color="red"
                    dashArray="10, 10"
                    weight={3}
                  />
                </>
              )}
            </MapContainer>
            
            {incidentData?.hospital && (
              <div className="absolute bottom-6 left-6 right-6 z-[1000]">
                <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-[1.5rem] border border-red-500/30 shadow-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500/20 p-3 rounded-2xl">
                      <Navigation className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Assigned Hospital</div>
                      <div className="text-xl font-black text-white">{incidentData.hospital.name}</div>
                      <div className="text-sm text-slate-400">{incidentData.hospital.address}</div>
                    </div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</div>
                    <div className="text-lg font-black text-green-500">Ambulance Notified</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmergencyModal 
        isOpen={modalOpen} 
        onSafe={handleSafe} 
        onTimeout={handleTimeout} 
      />
    </div>
  );
}
