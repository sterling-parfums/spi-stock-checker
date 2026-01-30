type ScannerAppBarProps = {
  userName: string;
  userEmail?: string;
};

export default function ScannerAppBar({
  userName,
  userEmail,
}: ScannerAppBarProps) {
  return (
    <header className="relative z-30 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#960000]/50 bg-[#960000]/20 text-sm font-semibold">
          S
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
            SAP Stock Console
          </p>
          <p className="text-sm text-white/80">Warehouse Scan</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="/auth/logout"
          className="hidden rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/70 transition hover:border-white/35 hover:text-white sm:inline-flex"
        >
          Logout
        </a>
        <details className="relative">
          <summary className="list-none">
            <span className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/35">
              {userName.slice(0, 2)}
            </span>
          </summary>
          <div className="absolute right-0 z-40 mt-3 w-60 rounded-2xl border border-white/10 bg-[#0a0b0f] p-4 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              Signed in
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {userName}
            </p>
            {userEmail ? (
              <p className="mt-1 text-xs text-white/60">{userEmail}</p>
            ) : null}
            <div className="mt-4 h-px bg-white/10" />
            <a
              href="/auth/logout"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/70 transition hover:border-white/35 hover:text-white"
            >
              Logout
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
