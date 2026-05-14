const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*", // allow all in dev
    methods: ["GET", "POST"]
  }
});

// Mock database
const users = [];
const incidents = [];

// Mock hospital data (since we're skipping Google Places API for now)
const mockHospitals = [
  { id: 1, name: "City General Hospital", lat: 28.704060, lng: 77.102493, distance: "1.2 km" },
  { id: 2, name: "St. Jude's Medical Center", lat: 28.705000, lng: 77.103000, distance: "2.5 km" },
  { id: 3, name: "Mercy Hospital", lat: 28.700000, lng: 77.100000, distance: "3.1 km" }
];

app.get('/', (req, res) => {
  res.send('LifeSaver AI Backend is running.');
});

// Register User Profile
app.post('/api/users', (req, res) => {
  const user = { id: Date.now().toString(), ...req.body };
  users.push(user);
  res.json({ message: "User registered successfully", user });
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

// Report an Incident
app.post('/api/incidents', (req, res) => {
  const { userId, location, timestamp, status } = req.body;
  
  // Find nearest hospital (mock logic)
  const nearestHospital = mockHospitals[0];

  const incident = {
    id: Date.now().toString(),
    userId,
    location,
    timestamp,
    status,
    hospital: nearestHospital,
  };

  incidents.push(incident);

  // Trigger emergency protocol (Mock Twilio / Mock Hospital API)
  console.log(`[EMERGENCY PROTOCOL] Triggered for user ${userId}`);
  console.log(`[SMS] Sending SMS to emergency contacts...`);
  console.log(`[CALL] Calling emergency contacts...`);
  console.log(`[HOSPITAL] Notifying ${nearestHospital.name}...`);

  // Emit to all connected clients (e.g., family dashboard)
  io.emit('new_incident', incident);

  res.json({ message: "Incident reported and emergency protocol initiated", incident });
});

app.get('/api/incidents', (req, res) => {
  res.json(incidents);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
