import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="font-bold text-xl mr-8 text-green-700">Oorah Admissions</div>
        <div className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link
            href="/campers"
            className="text-sm font-medium transition-colors hover:text-green-600 text-slate-700"
          >
            Campers
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm text-slate-500">Admin ▼</span>
        </div>
      </div>
    </nav>
  );
}
