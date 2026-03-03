"use client";

import { useState, useEffect } from "react";
import { Music, Users, Clock, Plus, BarChart2 } from "lucide-react";
import { io, Socket } from "socket.io-client";

// Types matching SCHEMA.md
interface Bounty {
  id: string;
  songTitle: string;
  artist: string;
  totalAmount: number; // cents
  backerCount: number;
}

interface Show {
  id: string;
  bandName: string;
  venueName: string;
  startTime: string; // ISO timestamp
  status: "synced" | "created" | "live" | "settling" | "ended";
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function calcCountdown(targetTime: string, status: Show["status"]): string {
  if (status === "live") return "LIVE NOW";
  if (status === "settling") return "Settling";
  if (status === "ended") return "Show ended";

  const diff = new Date(targetTime).getTime() - Date.now();
  if (diff <= 0) return "Starting now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : `${m}:${s.toString().padStart(2, "0")}`;
}

function useCountdown(targetTime: string, status: Show["status"]): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status === "live" || status === "settling" || status === "ended") return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  return calcCountdown(targetTime, status);
}

// Demo data shown while no backend is connected
const DEMO_SHOW: Show = {
  id: "demo",
  bandName: "The Midnight",
  venueName: "Fillmore West",
  startTime: new Date(Date.now() + 38 * 60 * 1000).toISOString(),
  status: "live",
};

const DEMO_BOUNTIES: Bounty[] = [
  { id: "1", songTitle: "Monsters", artist: "The Midnight", totalAmount: 8500, backerCount: 12 },
  { id: "2", songTitle: "Los Angeles", artist: "The Midnight", totalAmount: 6200, backerCount: 8 },
  { id: "3", songTitle: "Crystalline", artist: "The Midnight", totalAmount: 4750, backerCount: 6 },
  { id: "4", songTitle: "Endless Summer", artist: "The Midnight", totalAmount: 3100, backerCount: 4 },
  { id: "5", songTitle: "Sunset", artist: "The Midnight", totalAmount: 1800, backerCount: 3 },
];

const PRESET_AMOUNTS = [5, 10, 20, 50];

interface BackModalProps {
  bounty: Bounty;
  onClose: () => void;
}

function BackModal({ bounty, onClose }: BackModalProps) {
  const [preset, setPreset] = useState<number>(10);
  const [custom, setCustom] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const selectedAmount = custom ? parseFloat(custom) : preset;

  const handleBack = async () => {
    if (!selectedAmount || selectedAmount < 1) return;
    setSubmitting(true);
    // TODO: POST /api/contributions { bountyId, amountCents }
    // Then mount Stripe PaymentElement with returned clientSecret
    await new Promise<void>((r) => setTimeout(r, 800));
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-zinc-900 p-6 pb-10">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Back this bounty
        </div>
        <h2 className="mb-0.5 text-xl font-bold text-white">{bounty.songTitle}</h2>
        <p className="mb-6 text-sm text-zinc-400">{bounty.artist}</p>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setPreset(a); setCustom(""); }}
              className={`rounded-xl py-3 text-base font-semibold transition-colors ${
                !custom && preset === a
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              }`}
            >
              ${a}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <input
            type="number"
            min="1"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={handleBack}
          disabled={submitting || !selectedAmount || selectedAmount < 1}
          className="w-full rounded-xl bg-emerald-500 py-4 text-base font-bold text-white transition-opacity disabled:opacity-50 active:opacity-80"
        >
          {submitting
            ? "Processing…"
            : `Back for $${selectedAmount || "—"}`}
        </button>
      </div>
    </div>
  );
}

export default function BountyBoard({ showId }: { showId: string }) {
  const [show, setShow] = useState<Show>({ ...DEMO_SHOW, id: showId });
  const [bounties, setBounties] = useState<Bounty[]>(DEMO_BOUNTIES);
  const [backTarget, setBackTarget] = useState<Bounty | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return; // no backend configured — show demo data

    const socket: Socket = io(apiUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnectionAttempts: 3,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_show", showId);
    });

    socket.on("show_data", (data: Show) => setShow(data));

    socket.on("bounties_updated", (data: Bounty[]) => {
      setBounties([...data].sort((a, b) => b.totalAmount - a.totalAmount));
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {}); // silent — keep demo data

    return () => { socket.disconnect(); };
  }, [showId]);

  const countdown = useCountdown(show.startTime, show.status);
  const isLive = show.status === "live";
  const sortedBounties = [...bounties].sort((a, b) => b.totalAmount - a.totalAmount);
  const topAmount = sortedBounties[0]?.totalAmount ?? 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Sticky show header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-4 pb-4 pt-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between pb-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {show.status}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
              <Clock size={14} className="text-zinc-500" />
              {countdown}
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-white">
            {show.bandName}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">{show.venueName}</p>
        </div>
      </div>

      {/* Bounty list */}
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 size={14} className="text-zinc-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Song Requests
          </span>
          {connected && (
            <span className="ml-auto text-xs font-semibold text-emerald-500">
              ● Live
            </span>
          )}
        </div>

        <ul className="space-y-3">
          {sortedBounties.map((bounty, index) => {
            const pct = Math.max(8, (bounty.totalAmount / topAmount) * 100);
            return (
              <li
                key={bounty.id}
                className="relative overflow-hidden rounded-2xl bg-zinc-900"
              >
                {/* Progress fill */}
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500/10 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />

                <div className="relative flex items-center gap-3 p-4">
                  {/* Rank */}
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-zinc-500">
                    {index + 1}
                  </span>

                  {/* Song info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {bounty.songTitle}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-sm text-zinc-400">
                      <Music size={11} />
                      {bounty.artist}
                    </p>
                  </div>

                  {/* Amount + backer count */}
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-lg font-bold text-emerald-400">
                      {formatDollars(bounty.totalAmount)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Users size={10} />
                      {bounty.backerCount}
                    </span>
                  </div>

                  {/* Back This button */}
                  <button
                    onClick={() => setBackTarget(bounty)}
                    className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white active:opacity-70"
                    aria-label={`Back ${bounty.songTitle}`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {sortedBounties.length === 0 && (
          <div className="py-16 text-center text-zinc-600">
            <Music size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bounties yet.</p>
            <p className="mt-1 text-sm">Be the first to request a song!</p>
          </div>
        )}
      </div>

      {/* Back This modal */}
      {backTarget && (
        <BackModal bounty={backTarget} onClose={() => setBackTarget(null)} />
      )}
    </div>
  );
}
