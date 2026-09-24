'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

function greetingForHour(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardGreeting() {
  const [name, setName] = useState('Alex');
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
    try {
      const saved = localStorage.getItem('profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        const first = (parsed.name ?? '').toString().trim().split(' ')[0];
        if (first) setName(first);
      }
    } catch { /* keep default */ }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const first = (parsed.name ?? '').toString().trim().split(' ')[0];
          if (first) setName(first);
        } catch { /* ignore */ }
      }
    };
    const onCustom = () => {
      try {
        const saved = localStorage.getItem('profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          const first = (parsed.name ?? '').toString().trim().split(' ')[0];
          if (first) setName(first);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('attendly:profile', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('attendly:profile', onCustom);
    };
  }, []);

  return (
    <>
      <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
        {greeting}, {name} <span className="text-yellow-400">✨</span>
      </h1>
    </>
  );
}
