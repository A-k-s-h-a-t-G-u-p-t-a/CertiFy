import { Lock, User, Menu, Shield, Bell, Settings, HelpCircle } from "lucide-react"

export default function DigiLockerHeader() {
  return (
    <header className="w-full">
      {/* Top bar with DigiLocker branding */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <Lock className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">DigiLocker</span>
                <span className="text-xs text-blue-200">डिजिटल लॉकर | National Digital Locker</span>
              </div>
            </div>
            <span className="hidden md:inline-block px-3 py-1 bg-yellow-400/20 text-yellow-200 rounded-full text-xs font-medium backdrop-blur-sm border border-yellow-400/30">
              MOCK DEMONSTRATION
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-green-300" />
              <span className="text-sm">Powered by CertiFy Blockchain</span>
            </div>
            <button className="hidden md:flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="hidden md:flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <span className="hidden sm:inline text-sm font-medium">Amit Kumar</span>
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="bg-blue-800/90 backdrop-blur-sm border-b border-blue-700" aria-label="Primary">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {[
              { name: "Dashboard", active: true },
              { name: "Issued Documents", active: false },
              { name: "Uploaded Documents", active: false },
              { name: "Shared", active: false },
              { name: "Activities", active: false }
            ].map((item) => (
              <li key={item.name}>
                <button
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${item.active
                      ? "border-yellow-400 text-white"
                      : "border-transparent text-blue-200 hover:text-white hover:border-blue-400"
                    }`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
