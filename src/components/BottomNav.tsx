'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, Utensils, MessageCircle } from 'lucide-react'

type Tab = {
  href: string
  label: string
  Icon: typeof Dumbbell
  center?: boolean
}

const TABS: Tab[] = [
  { href: '/', label: '운동', Icon: Dumbbell },
  { href: '/coach', label: 'Coach', Icon: MessageCircle, center: true },
  { href: '/diet', label: '식단', Icon: Utensils },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 dark:border-stone-800 bg-white/85 dark:bg-stone-950/85 backdrop-blur-xl">
      <div className="mx-auto max-w-md grid grid-cols-3 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ href, label, Icon, center }) => {
          const active = isActive(href)
          if (center) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex items-center justify-center"
              >
                <div
                  className={`-mt-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    active
                      ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={2.2} />
                </div>
              </Link>
            )
          }
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                active
                  ? 'text-stone-900 dark:text-stone-100'
                  : 'text-stone-400 dark:text-stone-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[11px] font-medium tracking-wide uppercase">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
