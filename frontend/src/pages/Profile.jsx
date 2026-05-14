import { useState } from 'react';
import { User, Heart, Phone, Save } from 'lucide-react';

export default function Profile() {
  const [formData, setFormData] = useState({
    name: '',
    bloodGroup: '',
    medicalConditions: '',
    emergencyContact1Name: '',
    emergencyContact1Phone: '',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto mb-10">
      <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-white/5">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-xl">
            <User className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          </div>
          Profile Setup
        </h1>
        <p className="text-slate-400 text-sm md:text-base mb-8">This information will be shared with emergency services.</p>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white" 
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Blood Group</label>
                <input 
                  type="text" 
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-white" 
                  placeholder="O+"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2"><Heart className="w-4 h-4"/> Medical Conditions</label>
              <textarea 
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white h-24" 
                placeholder="Asthma, Diabetes, Allergies..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 pt-4">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Contact Name</label>
                <input 
                  type="text" 
                  name="emergencyContact1Name"
                  value={formData.emergencyContact1Name}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white" 
                  placeholder="Jane Doe (Wife)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2"><Phone className="w-4 h-4"/> Phone Number</label>
                <input 
                  type="tel" 
                  name="emergencyContact1Phone"
                  value={formData.emergencyContact1Phone}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white" 
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20 transition active:scale-95"
            >
              <Save className="w-5 h-5"/>
              {saved ? 'Profile Saved!' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
