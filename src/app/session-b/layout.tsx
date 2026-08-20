import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

export default function SessionBLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="bg-teal-800 text-white py-3 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌲</span>
            <span className="font-bold">Session B — Girls Campus</span>
            <span className="text-xs bg-teal-700 px-2 py-0.5 rounded-full">July 30 – August 26</span>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/session-b/campers" className="hover:underline">Campers Roster</Link>
            <Link href="/session-b/staff" className="hover:underline">Staff Roster</Link>
          </div>
        </div>
      </div>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  )
}
