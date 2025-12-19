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
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
