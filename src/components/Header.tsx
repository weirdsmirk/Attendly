'use client';
import { Search, Moon, Sun, Bell, X, Database, Save } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'Alex Rivera',
    initials: 'AR',
    course: 'Computer Science · Year 2',
    studentId: 'CS2024-0042',
    semester: '4th Semester'
  });

  const [editProfile, setEditProfile] = useState(profile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  let pageName = 'Overview';
  if (pathname === '/history') pageName = 'History';
  if (pathname === '/timetable') pageName = 'Timetable';
  if (pathname === '/subjects') pageName = 'Subjects';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditProfile(parsed);
      } catch (e) {}
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const saveProfile = () => {
    // Generate initials
    const words = editProfile.name.split(' ');
    let initials = '';
    if (words.length > 0) initials += words[0][0] || '';
    if (words.length > 1) initials += words[1][0] || '';
    if (initials === '') initials = '?';
    
    const newProfile = { ...editProfile, initials: initials.toUpperCase() };
    setProfile(newProfile);
    localStorage.setItem('profile', JSON.stringify(newProfile));
    setIsEditingProfile(false);
  };

  return (
    <>
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Workspace <span className="mx-2 text-slate-300 dark:text-slate-600">&gt;</span> <span className="text-slate-900 dark:text-white font-semibold">{pageName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search subjects..." 
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 transition-shadow"
            />
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative cursor-pointer">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </button>
          <button 
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-sm ml-1 cursor-pointer border border-purple-200 dark:border-purple-800 hover:opacity-80 transition-opacity"
            title="Profile"
          >
            {profile.initials}
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowProfile(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile</h2>
              <button onClick={() => { setShowProfile(false); setIsEditingProfile(false); }} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            {!isEditingProfile ? (
              <div className="p-5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-xl border border-purple-200 dark:border-purple-800">
                    {profile.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{profile.course}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Student ID</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{profile.studentId}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Semester</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{profile.semester}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Data storage</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Database size={14} />
                      Local SQLite
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full btn btn-secondary"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="p-5">
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                    <input type="text" className="input" value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Course & Year</label>
                    <input type="text" className="input" value={editProfile.course} onChange={e => setEditProfile({...editProfile, course: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
                    <input type="text" className="input" value={editProfile.studentId} onChange={e => setEditProfile({...editProfile, studentId: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                    <input type="text" className="input" value={editProfile.semester} onChange={e => setEditProfile({...editProfile, semester: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsEditingProfile(false); setEditProfile(profile); }}
                    className="flex-1 btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveProfile}
                    className="flex-1 btn btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
