const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  medicalConditions: { type: String },
  emergencyContacts: [
    {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    }
  ],
  preferredHospital: { type: String }, // Optional preferred hospital
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
