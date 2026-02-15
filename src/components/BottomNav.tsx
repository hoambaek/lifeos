'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Activity, BookOpen, BarChart3, Utensils } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/diet', icon: Utensils, label: '식단' },
  { href: '/log', icon: ClipboardList, label: '기록' },
  { href: '/inbody', icon: Activity, label: '인바디' },
  { href: '/stats', icon: BarChart3, label: '통계' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav safe-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? 'text-stone-900 dark:text-stone-100'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
