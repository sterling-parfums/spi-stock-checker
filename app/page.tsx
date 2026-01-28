import { auth0 } from "@/lib/auth0";
import ScannerClient from "./components/ScannerClient";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] text-white">
        <div className="relative isolate min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(150,0,0,0.28),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,164,164,0.18),_transparent_50%)]" />
          <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#960000]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-12 right-8 h-64 w-64 rounded-full bg-[#c24444]/20 blur-3xl" />

          <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-16 lg:px-12">
            <div className="flex w-full flex-col items-center gap-8 text-center">
              <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
                Warehouse Access
              </div>
              <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-tight md:text-5xl">
                Scan. Verify. Ship.{" "}
                <span className="text-[#960000] drop-shadow-[0_0_18px_rgba(150,0,0,0.5)]">
                  Instant stock clarity.
                </span>
              </h1>
              <p className="max-w-xl text-pretty text-base text-white/70 md:text-lg">
                Sign in to activate the camera feed, scan incoming barcodes, and
                query SAP inventory in real time.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#960000] bg-[#960000] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(150,0,0,0.35)] transition hover:border-[#7c0000] hover:bg-[#7c0000]"
                >
                  Log in with Auth0
                </a>
                <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs uppercase tracking-[0.25em] text-white/60">
                  Authenticated access only
                </div>
              </div>
            </div>
            <div className="mt-16 grid w-full gap-6 md:grid-cols-3">
              {[
                {
                  title: "Secure identity",
                  body: "Auth0 handles enterprise identity, MFA, and session security.",
                },
                {
                  title: "Live barcode scan",
                  body: "Camera feed with live decoding for labels and cartons.",
                },
                {
                  title: "SAP stock lookup",
                  body: "Ping SAP instantly and see available stock on screen.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <ScannerClient
      userName={user.name ?? user.nickname ?? user.email ?? "Operator"}
      userEmail={user.email ?? undefined}
    />
  );
}
