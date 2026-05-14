import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import { Activity, User } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-20 md:pb-0">
        {/* Top Desktop Nav */}
        <nav className="bg-slate-800/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500/20 p-1.5 rounded-lg">
                  <Activity className="text-red-500 w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  LifeSaver<span className="text-red-500">AI</span>
                </span>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-1">
                <Link to="/" className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-white transition-all active:scale-95">Dashboard</Link>
                <Link to="/profile" className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-white flex items-center gap-2 transition-all active:scale-95">
                  <User className="w-4 h-4"/> Profile
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-2xl border-t border-white/5 z-50 px-6 py-3">
          <div className="flex justify-around items-center">
            <Link to="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition">
              <Activity className="w-6 h-6" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition">
              <User className="w-6 h-6" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
