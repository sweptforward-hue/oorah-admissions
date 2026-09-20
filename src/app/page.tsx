import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined
  if (params?.error || params?.error_code) {
    redirect('/access-denied')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          {/* Hero Section with Animation */}
          <div className="text-center mb-16 pt-10">
            <div className="inline-block px-4 py-1.5 bg-white border border-green-200 text-green-800 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm shadow-green-100 animate-fade-in-up">
              Admissions & Operations Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-emerald-600 to-green-900 tracking-tight mb-6 pb-2 animate-gradient-x drop-shadow-sm">
              <span className="block animate-slide-up-fade">oorah admissions</span>
            </h1>
            
            <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Comprehensive system for processing camper applications, managing VAAD voting, staff operations, contracts, and multi-session enrollments.
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link
              href="/dashboard"
              className="p-6 bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all hover:border-green-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-3xl"></div>
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform origin-bottom-left">📊</div>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-700">
                Dashboard
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                View circular status graphs, acceptance rates, and overall admissions analytics.
              </p>
            </Link>

            <Link
              href="/session-a/campers"
              className="p-6 bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all hover:border-green-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-3xl"></div>
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform origin-bottom-left">🏕️</div>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-700">
                Session A
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Manage campers, bunk assignments, and staff roster for Session A.
              </p>
            </Link>

            <Link
              href="/session-b/campers"
              className="p-6 bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all hover:border-green-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-3xl"></div>
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform origin-bottom-left">🌲</div>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-700">
                Session B
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Manage campers, bunk assignments, and staff roster for Session B.
              </p>
            </Link>

            <Link
              href="/admin"
              className="p-6 bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all hover:border-red-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-3xl"></div>
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform origin-bottom-left">⚙️</div>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-red-700">
                Admin Center
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Users, years, sessions, voting choices, custom fields, and audit log.
              </p>
            </Link>
          </div>

          {/* Action Banner */}
          <div className="bg-gradient-to-r from-green-800 via-emerald-700 to-green-900 text-white rounded-3xl p-10 shadow-2xl shadow-green-900/20 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '0.6s' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-extrabold tracking-tight">Ready to register a new applicant?</h3>
              <p className="text-green-100 text-base mt-2 max-w-xl">
                Start an application workspace with automatic document checklist and VAAD assignment.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto">
              <Link
                href="/campers/new"
                className="px-8 py-4 bg-white text-green-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-green-50 transition-all text-center flex items-center justify-center gap-2 group"
              >
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span> Create New Camper
              </Link>
              <Link
                href="/help"
                className="px-8 py-4 bg-green-900/40 border border-green-700/50 text-white font-semibold rounded-xl hover:bg-green-800/60 transition-all text-center backdrop-blur-sm"
              >
                View User Guide
              </Link>
            </div>
          </div>
        </main>
        
        {/* Footer Branding */}
        <footer className="mt-auto py-8 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
            <div className="text-xs text-slate-400 font-medium tracking-widest uppercase mb-1">System Architecture</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-semibold">powered by</span>
              <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 tracking-tighter">ACD</span>
            </div>
          </div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-fade {
          animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}} />
    </div>
  )
}
