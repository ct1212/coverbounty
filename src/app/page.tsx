import { Music, QrCode, DollarSign, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Hero */}
      <header className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
          <Music size={32} className="text-emerald-400" />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          CoverBounty
        </h1>
        <p className="mx-auto max-w-md text-lg text-zinc-400">
          Real-time crowdfunding for live music setlists. Fans pool money to
          request songs. Bands get paid when they play them.
        </p>
        <Link
          href="/show/demo"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 active:opacity-70"
        >
          <Zap size={18} />
          See a Live Demo
        </Link>
      </header>

      {/* How it works */}
      <section className="border-t border-zinc-800 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step
              icon={<QrCode size={24} className="text-emerald-400" />}
              title="Scan"
              desc="Fan scans a QR code at the venue to open the live bounty board."
            />
            <Step
              icon={<DollarSign size={24} className="text-emerald-400" />}
              title="Back"
              desc="Pick a song and put money behind it. Watch the bounty climb as others pile on."
            />
            <Step
              icon={<Music size={24} className="text-emerald-400" />}
              title="Play"
              desc="Band sees ranked requests. Play the song, tap Played, get paid."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-600">
        CoverBounty &middot; The Department of Quietly Getting Things Done
      </footer>
    </div>
  );
}

function Step({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400">{desc}</p>
    </div>
  );
}
