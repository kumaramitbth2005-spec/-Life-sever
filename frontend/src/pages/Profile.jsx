import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { User, Heart, Phone, Save, Plus, Trash2, Hospital } from 'lucide-react';

export default function Profile() {
  const [formData, setFormData] = useState({
    name: '',
    bloodGroup: '',
    medicalConditions: '',
    preferredHospital: '',
    emergencyContacts: [
      { name: '', phone: '' },
      { name: '', phone: '' },
      { name: '', phone: '' },
      { name: '', phone: '' },
      { name: '', phone: '' }
    ]
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      if (data.length > 0) {
        const user = data[0];
        const contacts = [...user.emergencyContacts];
        while (contacts.length < 5) contacts.push({ name: '', phone: '' });
        
        setFormData({
          name: user.name || '',
          bloodGroup: user.bloodGroup || '',
          medicalConditions: user.medicalConditions || '',
          preferredHospital: user.preferredHospital || '',
          emergencyContacts: contacts
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validContacts = formData.emergencyContacts.filter(c => c.name && c.phone);
    
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, emergencyContacts: validContacts })
      });
      const data = await res.json();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error saving profile.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...formData.emergencyContacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, emergencyContacts: newContacts });
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-slate-400">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto mb-10">
      <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-xl">
            <User className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          </div>
          Profile Setup
        </h1>
        <p className="text-slate-400 text-sm md:text-base mb-8">This information will be shared with emergency services and hospitals during an accident.</p>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700/50 pb-2">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition text-white placeholder:text-slate-600" 
                  placeholder="e.g. Ayush Ranjan"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Blood Group</label>
                <input 
                  type="text" 
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition text-white placeholder:text-slate-600" 
                  placeholder="e.g. O+"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-red-400"/> Medical Conditions
              </label>
              <textarea 
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition text-white h-24 placeholder:text-slate-600 resize-none" 
                placeholder="List any allergies, medications, or chronic conditions..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-2">
                <Hospital className="w-3.5 h-3.5 text-green-400"/> Preferred Hospital (Optional)
              </label>
              <input 
                type="text" 
                name="preferredHospital"
                value={formData.preferredHospital}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition text-white placeholder:text-slate-600" 
                placeholder="e.g. City General Hospital"
              />
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700/50 pb-2 pt-4 flex items-center justify-between">
              Emergency Contacts
              <span className="text-[10px] font-normal text-slate-500 uppercase">Up to 5 numbers</span>
            </h3>
            
            <div className="space-y-4">
              {formData.emergencyContacts.map((contact, index) => (
                <div key={index} className="bg-slate-900/30 p-4 rounded-2xl border border-slate-700/30 relative group">
                  <div className="absolute -top-3 left-4 bg-slate-800 px-2 text-[10px] font-bold text-slate-400 rounded border border-slate-700 uppercase">
                    Contact {index + 1}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input 
                      type="text" 
                      value={contact.name}
                      onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition text-sm text-white" 
                      placeholder="Name"
                      required={index === 0}
                    />
                    <input 
                      type="tel" 
                      value={contact.phone}
                      onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition text-sm text-white" 
                      placeholder="Phone Number"
                      required={index === 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              className={`w-full font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-all active:scale-[0.98] ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}
            >
              <Save className="w-5 h-5"/>
              {saved ? 'Profile Saved Successfully!' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
