import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-1000 flex flex-col">
      <header className="px-6 py-4 border-b border-surface-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">OV</div>
            <span className="text-lg font-bold text-white">OpenVerify</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/login?tab=register"
              className="text-sm px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
            Open Source · Self-Hosted · Secure
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Discord Verification &{" "}
            <span className="text-indigo-400">Backup System</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
            Self-host your own Discord OAuth2 verification and encrypted backup infrastructure.
            Full control over your data with military-grade encryption.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
            <a
              href="https://github.com/openverify/openverify"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-surface-600 hover:bg-surface-800 text-gray-300 rounded-lg font-medium transition-colors"
            >
              GitHub
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-16">
            <div className="p-4 rounded-xl bg-surface-900 border border-surface-800">
              <div className="text-2xl font-bold text-white mb-1">AES-256-GCM</div>
              <div className="text-sm text-gray-500">End-to-end encryption</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-900 border border-surface-800">
              <div className="text-2xl font-bold text-white mb-1">OAuth2</div>
              <div className="text-sm text-gray-500">Discord integration</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-900 border border-surface-800">
              <div className="text-2xl font-bold text-white mb-1">Self-Hosted</div>
              <div className="text-sm text-gray-500">Full data control</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
