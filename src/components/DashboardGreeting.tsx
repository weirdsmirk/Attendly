import { format } from 'date-fns'
import { useSettings } from '../lib/settings'

function greetingForHour(h: number) {
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardGreeting() {
  const { profile } = useSettings()
  const first = profile.name.trim().split(' ')[0] || 'there'

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {greetingForHour(new Date().getHours())}, {first}
        </h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">{format(new Date(), 'EEEE, d MMMM')}</span>
      </div>
    </>
  )
}
