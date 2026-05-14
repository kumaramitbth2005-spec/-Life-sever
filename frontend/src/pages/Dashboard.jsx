import { useState, useEffect } from 'react';
import { useSensors } from '../hooks/useSensors';
import EmergencyModal from '../components/EmergencyModal';
import { io } from 'socket.io-client';
import { Shield, ShieldAlert, Activity, Navigation, Smartphone } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Custom Hospital Icon
const hospitalIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2966/2966473.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});

// Component to recenter map
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
  const { startMonitoring, stopMonitoring, isMonitoring, motionData, speed, location } = useSensors();
  const [modalOpen, setModalOpen] = useState(false);
  const [incidentData, setIncidentData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    // Fetch logs and profile on mount
    fetchLogs();
    fetchProfile();

    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('new_incident', (data) => {
      console.log('New incident received via socket:', data);
      setIncidentData(data);
      setLogs(prev => {
        if (prev.find(log => log.id === data.id)) return prev;
        return [data, ...prev];
      });
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isMonitoring && motionData.maxG > 3.0) {
      triggerAccident();
    }
  }, [motionData, isMonitoring]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/incidents');
      const data = await res.json();
      setLogs(data.reverse());
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      if (data.length > 0) {
        setUserProfile(data[0]);
      }
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
          userId: userProfile?.id || 'user_123',
          location: location || { lat: 28.704060, lng: 77.102493 },
          timestamp: new Date().toISOString(),
          status: 'critical'
        })
      });
      const data = await response.json();
      console.log('Emergency response:', data);
      fetchLogs();
    } catch (err) {
      console.error('Failed to trigger emergency', err);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1 tracking-tight">Monitoring Dashboard</h1>
          <p className="text-slate-400 text-xs md:text-sm">Real-time sensor and location tracking</p>
        </div>
        <div className="flex w-full md:w-auto gap-2 md:gap-3">
          <button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${isMonitoring ? 'bg-slate-700/50 text-slate-300' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}
          >
            {isMonitoring ? <Shield className="w-4 h-4 md:w-5 md:h-5"/> : <ShieldAlert className="w-4 h-4 md:w-5 md:h-5"/>}
            <span className="text-sm md:text-base">{isMonitoring ? 'Stop' : 'Start'}</span>
          </button>
          
          <button 
            onClick={triggerAccident}
            className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
          >
            <span className="text-sm md:text-base text-nowrap">Simulate Accident</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/5">
            <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-400"/> Device Sensors</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
              <div className="bg-slate-900/60 rounded-xl p-3 md:p-4 border border-white/5">
                <div className="text-slate-500 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Speed</div>
                <div className="text-xl md:text-3xl font-black tabular-nums">{Math.round(speed)} <span className="text-[10px] md:text-sm font-normal text-slate-500">km/h</span></div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 md:p-4 border border-white/5">
                <div className="text-slate-500 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Impact Force</div>
                <div className="text-xl md:text-3xl font-black tabular-nums text-red-400">{motionData.maxG.toFixed(1)} <span className="text-[10px] md:text-sm font-normal text-slate-500">G</span></div>
              </div>
            </div>
          </div>

          {incidentData && (
            <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/30">
              <h3 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2"><Activity className="w-5 h-5"/> Emergency Active</h3>
              <p className="text-sm text-slate-300 mb-4">Emergency contacts have been notified.</p>
              {incidentData.hospital && (
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Nearest Hospital</div>
                  <div className="font-semibold text-white">{incidentData.hospital.name}</div>
                  <div className="text-sm text-slate-400">Distance: {incidentData.hospital.distance}</div>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-300">
              <Activity className="w-5 h-5 text-purple-400"/> Recent Alerts
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-sm italic text-center py-4">No recent incidents recorded.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-red-400 uppercase text-[10px]">Critical Accident</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-300 text-xs">Hospital: {log.hospital?.name || 'Searching...'}</div>
                    <div className="text-slate-500 text-[10px] mt-1">{new Date(log.timestamp).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Navigation className="w-5 h-5 text-green-400"/> Live Tracking</h3>
          <div className="bg-slate-900 rounded-xl flex-1 overflow-hidden min-h-[400px] border border-slate-700 relative z-10">
            <MapContainer 
              center={location || { lat: 28.704060, lng: 77.102493 }} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
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
                <Marker 
                  position={[incidentData.hospital.lat, incidentData.hospital.lng]}
                  icon={hospitalIcon}
                >
                  <Popup>{incidentData.hospital.name}</Popup>
                </Marker>
              )}
            </MapContainer>
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
