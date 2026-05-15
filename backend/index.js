require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const twilio = require('twilio');

// Models
const User = require('./models/User');
const Incident = require('./models/Incident');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Twilio Setup
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifesaver')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- Helper Functions ---

const sendEmergencySMS = async (contacts, location, userName) => {
  const mapsUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
  const message = `Emergency Alert: ${userName} may have been involved in an accident. Current live location: ${mapsUrl}. Please reach immediately.`;
  
  for (const contact of contacts) {
    console.log(`[SMS] Sending to ${contact.name} (${contact.phone})...`);
    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        });
      } catch (err) {
        console.error(`Failed to send SMS to ${contact.phone}:`, err.message);
      }
    } else {
      console.log(`[MOCK SMS] Content: ${message}`);
    }
  }
};

const makeEmergencyCall = async (contacts, userName) => {
  const message = `Emergency alert. ${userName} may have been involved in an accident. Please check the SMS sent with the live location.`;
  
  for (const contact of contacts) {
    console.log(`[CALL] Calling ${contact.name} (${contact.phone})...`);
    if (twilioClient) {
      try {
        await twilioClient.calls.create({
          twiml: `<Response><Say>${message}</Say></Response>`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        });
      } catch (err) {
        console.error(`Failed to make call to ${contact.phone}:`, err.message);
      }
    } else {
      console.log(`[MOCK CALL] Content: ${message}`);
    }
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
};

const findNearestHospital = async (location) => {
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
        params: {
          location: `${location.lat},${location.lng}`,
          radius: 5000,
          type: 'hospital',
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });
      
      if (response.data.results.length > 0) {
        const resultsWithDistance = response.data.results.map(h => {
          const dist = calculateDistance(location.lat, location.lng, h.geometry.location.lat, h.geometry.location.lng);
          return {
            name: h.name,
            address: h.vicinity,
            coordinates: h.geometry.location,
            place_id: h.place_id,
            distance: dist.toFixed(2)
          };
        }).sort((a, b) => a.distance - b.distance);

        return resultsWithDistance[0];
      }
    } catch (err) {
      console.error("Google Places API error:", err.message);
    }
  }
  
  // Fallback / Mock
  const mockLat = location.lat + 0.01;
  const mockLng = location.lng + 0.01;
  return {
    name: "City General Hospital",
    address: "123 Health Ave, Emergency Sector",
    phone: "+1 555-0199",
    coordinates: { lat: mockLat, lng: mockLng },
    distance: calculateDistance(location.lat, location.lng, mockLat, mockLng).toFixed(2)
  };
};

// --- API Endpoints ---

// User Profile
app.post('/api/users', async (req, res) => {
  try {
    const { name, bloodGroup, medicalConditions, emergencyContacts, preferredHospital } = req.body;
    let user = await User.findOne();
    if (user) {
      Object.assign(user, { name, bloodGroup, medicalConditions, emergencyContacts, preferredHospital });
      await user.save();
    } else {
      user = new User({ name, bloodGroup, medicalConditions, emergencyContacts, preferredHospital });
      await user.save();
    }
    res.json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Incidents
app.post('/api/incidents', async (req, res) => {
  try {
    const { userId, location, timestamp, status } = req.body;
    
    // Get user details
    const user = await User.findById(userId) || await User.findOne();
    const userName = user ? user.name : "Unknown User";
    const userBloodGroup = user ? user.bloodGroup : "Not provided";
    const userMedicalConditions = user ? user.medicalConditions : "None";
    const contacts = user ? user.emergencyContacts : [];

    // 1. Hospital Logic
    let hospital;
    if (user && user.preferredHospital) {
      hospital = { name: user.preferredHospital, address: "User Preferred Hospital", coordinates: location, distance: "0.00" };
    } else {
      hospital = await findNearestHospital(location);
    }

    // 2. Save Incident
    const incident = new Incident({
      userId: user ? user._id : null,
      location,
      timestamp,
      status,
      hospital,
      notifiedContacts: contacts.map(c => c.phone)
    });
    await incident.save();

    // 3. Emergency Workflow
    sendEmergencySMS(contacts, location, userName);
    makeEmergencyCall(contacts, userName);
    
    // 4. Notify Hospital (Simulated)
    console.log(`[HOSPITAL NOTIFICATION] Sent to ${hospital.name}:`);
    console.log(`- User: ${userName}`);
    console.log(`- Blood Group: ${userBloodGroup}`);
    console.log(`- Conditions: ${userMedicalConditions}`);
    console.log(`- Location: https://maps.google.com/?q=${location.lat},${location.lng}`);
    console.log(`- Time: ${timestamp}`);

    io.emit('new_incident', incident);

    res.json({ message: "Emergency protocol initiated", incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ timestamp: -1 }).limit(20);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency Specific Endpoints
app.post('/api/emergency/send-sms', async (req, res) => {
  const { contacts, location, userName } = req.body;
  await sendEmergencySMS(contacts, location, userName);
  res.json({ success: true });
});

app.post('/api/emergency/make-call', async (req, res) => {
  const { contacts, userName } = req.body;
  await makeEmergencyCall(contacts, userName);
  res.json({ success: true });
});

app.post('/api/emergency/find-nearest-hospital', async (req, res) => {
  try {
    const { location } = req.body;
    const hospital = await findNearestHospital(location);
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emergency/notify-hospital', async (req, res) => {
  try {
    const { hospitalId, incidentDetails } = req.body;
    console.log(`[HOSPITAL NOTIFICATION] Hospital ${hospitalId} notified:`, incidentDetails);
    res.json({ success: true, message: "Hospital notified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
