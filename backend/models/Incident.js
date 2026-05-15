const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['critical', 'resolved', 'false_alarm'], default: 'critical' },
  notifiedContacts: [String],
  hospital: {
    name: String,
    address: String,
    phone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }
});

module.exports = mongoose.model('Incident', IncidentSchema);
