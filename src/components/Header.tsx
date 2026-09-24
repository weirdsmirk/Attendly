'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { Search, Moon, Sun, Bell, X, Database } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getSubjects, getTimetable, getRecords } from '@/app/actions';

type Profile = {
  name: string;
  initials: string;
  course: string;
  studentId: string;
  semester: string;
};

const DEFAULT_PROFILE: Profile = {
  name: 'Alex Rivera',
  initials: 'AR',
  course: 'Computer Science · Year 2',
  studentId: 'CS2024-0042',
  semester: '4th Semester'
};

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return (words[0][0] ?? '?').toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase() || '?';
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{ title: string; detail: string; tone: 'rose' | 'indigo' | 'emerald' }[]>([]);
  const [query, setQuery] = useState('');

  // Profile state
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [editProfile, setEditProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  let pageName = 'Overview';
  if (pathname === '/history') pageName = 'History';
  if (pathname === '/timetable') pageName = 'Timetable';
  if (pathname === '/subjects') pageName = 'Subjects';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile) as Partial<Profile>;
        const merged = { ...DEFAULT_PROFILE, ...parsed } as Profile;
        merged.initials = initialsFor(merged.name);
        setProfile(merged);
        setEditProfile(merged);
      } catch { /* keep default */ }
    }
  }, []);

  useEffect(() => {
    const onClear = () => setQuery('');
    window.addEventListener('attendly:search:clear', onClear);
    return () => window.removeEventListener('attendly:search:clear', onClear);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfile(false);
        setIsEditingProfile(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
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
    setProfileError(null);
    const name = editProfile.name.trim();
    if (!name) {
      setProfileError('Name is required.');
      return;
    }
    const newProfile: Profile = {
      name,
      initials: initialsFor(name),
      course: editProfile.course.trim(),
      studentId: editProfile.studentId.trim(),
      semester: editProfile.semester.trim(),
    };
    setProfile(newProfile);
    setEditProfile(newProfile);
    localStorage.setItem('profile', JSON.stringify(newProfile));
    window.dispatchEvent(new CustomEvent('attendly:profile'));
    setIsEditingProfile(false);
  };

  const openProfile = () => {
    setEditProfile(profile);
    setProfileError(null);
    setIsEditingProfile(false);
    setShowProfile(true);
  };

  const onSearchChange = (value: string) => {
    setQuery(value);
    window.dispatchEvent(new CustomEvent('attendly:search', { detail: value }));
    if (value.trim() !== '' && pathname !== '/subjects') {
      router.push('/subjects');
    }
  };

  const loadNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (!next) return;
    try {
      const [subjects, timetable, records] = await Promise.all([getSubjects(), getTimetable(), getRecords()]);
      const items: typeof notifications = [];
      const today = new Date().getDay();
      const todaysCount = timetable.filter(t => t.day_of_week === today).length;
      if (todaysCount > 0) {
        items.push({ title: `${todaysCount} class${todaysCount === 1 ? '' : 'es'} today`, detail: 'Tap +1 on the dashboard to mark attendance.', tone: 'indigo' });
      } else {
        items.push({ title: 'No classes today', detail: 'Enjoy the break or add classes in Timetable.', tone: 'emerald' });
      }
      for (const sub of subjects) {
        const subRecords = records.filter(r => r.subject_id === sub.id);
        const conducted = subRecords.filter(r => r.status === 'Attended' || r.status === 'Skipped').length + sub.initial_conducted;
        const attended = subRecords.filter(r => r.status === 'Attended').length + sub.initial_attended;
        if (conducted === 0) continue;
        const pct = Math.round((attended / conducted) * 100);
        if (pct < sub.min_attendance_req) {
          items.push({ title: `${sub.name} at ${pct}%`, detail: `Below ${sub.min_attendance_req}% requirement — attend upcoming classes.`, tone: 'rose' });
        }
      }
      if (items.length === 0) {
        items.push({ title: 'All caught up', detail: 'No alerts right now.', tone: 'emerald' });
      }
      setNotifications(items.slice(0, 6));
    } catch {
      setNotifications([{ title: 'Could not load alerts', detail: 'Please try again.', tone: 'rose' }]);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Workspace <span className="text-slate-300 dark:text-slate-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></span> <span className="text-slate-900 dark:text-white font-semibold">{pageName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search subjects..."
              value={query}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative" ref={notifRef}>
            <button
              onClick={loadNotifications}
              className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative cursor-pointer"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell size={18} />
              {notifications.some(n => n.tone === 'rose') && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
              )}
              {!notifications.some(n => n.tone === 'rose') && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 z-40 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 font-semibold text-sm text-slate-900 dark:text-white">Notifications</div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 && (
                    <div className="px-4 py-6 text-sm text-slate-500 text-center">Loading…</div>
                  )}
                  {notifications.map((n, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className={`text-sm font-semibold ${n.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : n.tone === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{n.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={openProfile}
            className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-sm ml-1 cursor-pointer border border-purple-200 dark:border-purple-800 hover:bg-purple-200/70 dark:hover:bg-purple-900/50 transition-colors"
            title="Profile"
            aria-label="Open profile"
          >
            {profile.initials}
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => { setShowProfile(false); setIsEditingProfile(false); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile</h2>
              <button onClick={() => { setShowProfile(false); setIsEditingProfile(false); }} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close profile">
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">{profile.course || 'No course set'}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Student ID</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{profile.studentId || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Semester</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{profile.semester || '—'}</span>
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
                  onClick={() => { setEditProfile(profile); setProfileError(null); setIsEditingProfile(true); }}
                  className="w-full btn btn-secondary cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="p-5">
                {profileError && (
                  <div className="text-sm font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-lg px-3 py-2 mb-4">
                    {profileError}
                  </div>
                )}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                    <input type="text" className="input" value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Course & Year</label>
                    <input type="text" className="input" value={editProfile.course} onChange={e => setEditProfile({...editProfile, course: e.target.value})} placeholder="e.g. Computer Science · Year 2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
                    <input type="text" className="input" value={editProfile.studentId} onChange={e => setEditProfile({...editProfile, studentId: e.target.value})} placeholder="e.g. CS2024-0042" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                    <input type="text" className="input" value={editProfile.semester} onChange={e => setEditProfile({...editProfile, semester: e.target.value})} placeholder="e.g. 4th Semester" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditingProfile(false); setEditProfile(profile); setProfileError(null); }}
                    className="flex-1 btn btn-ghost cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    className="flex-1 btn btn-primary cursor-pointer"
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
