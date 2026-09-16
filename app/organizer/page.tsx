"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Plus,
  Layers,
  Users,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Calendar,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import {
  getMyOrganizedTournaments,
  createTournament,
  publishTournament,
  generateBracket,
  CreateTournamentPayload,
} from "@/lib/api/organizer";
import { getGames, Game } from "@/lib/api/games";
import { Tournament } from "@/lib/api/tournaments";

export default function OrganizerCockpitPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateTournamentPayload>({
    game_id: "",
    title: "",
    prize_pool_inr: 25000,
    entry_fee_inr: 50,
    starts_at: "Saturday, 8:00 PM IST",
    roster_lock_time: "Saturday, 7:30 PM IST",
    server_region: "AWS Mumbai (ap-south-1)",
    max_teams: 16,
    rank_requirement: "Open to All Ranks",
    format: "Single Elimination Bracket",
    description: "Sanctioned competitive esports tournament. Strict anti-cheat verification and automated brackets.",
    rules: ["Competitive MR12 rulebook", "Vanguard/VAC mandatory", "15-minute grace check-in"],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tournData, gamesData] = await Promise.all([
        getMyOrganizedTournaments().catch(() => []),
        getGames().catch(() => []),
      ]);
      setTournaments(tournData);
      setGames(gamesData);
      if (gamesData.length > 0 && !formData.game_id) {
        setFormData((prev) => ({ ...prev, game_id: gamesData[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createTournament(formData);
      setActionMsg(`Tournament "${created.title}" successfully created in DRAFT mode!`);
      setIsCreating(false);
      fetchData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to create tournament");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishTournament(id);
      setActionMsg("Tournament published! Registration is now OPEN to all players.");
      fetchData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to publish tournament");
    }
  };

  const handleGenerateBracket = async (id: string) => {
    try {
      await generateBracket(id);
      setActionMsg("Single Elimination Bracket generated! Tournament is now LIVE.");
      fetchData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to generate bracket");
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0B0E16] min-h-screen text-[#F8FAFC]">
      {/* 1. Header Bar */}
      <header className="bg-[#10141F] border-b border-[#242C3D] px-4 md:px-8 py-5">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#161A24] border border-[#242C3D] flex items-center justify-center text-[#F59E0B]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline font-bold text-lg text-white uppercase tracking-wider">
                  ORGANIZER COCKPIT
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F59E0B] text-slate-900 uppercase">
                  ORGANIZER ROLE
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono">
                Rule 9 & 20: Scoped tournament lifecycle, bracket generation & registrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? "Close Wizard" : "Create Tournament"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionMsg && (
        <div className="bg-[#10B981]/20 border-b border-[#10B981]/40 px-4 py-2.5 text-xs font-mono text-emerald-400 text-center">
          {actionMsg}
        </div>
      )}

      {/* 2. Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-8">
        {/* Creation Modal / Inline Drawer */}
        {isCreating && (
          <section className="bg-[#161A24] border border-[#E56A10]/40 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-[#242C3D] pb-3">
              <Plus className="w-5 h-5 text-[#E56A10]" />
              <h2 className="text-base font-bold font-headline text-white uppercase">
                New Tournament Specification Wizard
              </h2>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[#94A3B8] uppercase">Discipline / Game Title</label>
                <select
                  value={formData.game_id}
                  onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
                  className="w-full bg-[#0B0E16] border border-[#242C3D] p-2.5 rounded text-white focus:border-[#E56A10] outline-none"
                  required
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.tag})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] uppercase">Tournament Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AMETHEUS VALORANT WINTER CUP 2026"
                  className="w-full bg-[#0B0E16] border border-[#242C3D] p-2.5 rounded text-white focus:border-[#E56A10] outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] uppercase">Prize Pool (INR ₹)</label>
                <input
                  type="number"
                  value={formData.prize_pool_inr}
                  onChange={(e) => setFormData({ ...formData, prize_pool_inr: Number(e.target.value) })}
                  className="w-full bg-[#0B0E16] border border-[#242C3D] p-2.5 rounded text-white focus:border-[#E56A10] outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] uppercase">Entry Fee (INR ₹ / Team)</label>
                <input
                  type="number"
                  value={formData.entry_fee_inr}
                  onChange={(e) => setFormData({ ...formData, entry_fee_inr: Number(e.target.value) })}
                  className="w-full bg-[#0B0E16] border border-[#242C3D] p-2.5 rounded text-white focus:border-[#E56A10] outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] uppercase">Starts At</label>
                <input
                  type="text"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  className="w-full bg-[#0B0E16] border border-[#242C3D] p-2.5 rounded text-white focus:border-[#E56A10] outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] uppercase">Roster Lock Time</label>
                <input
                  type="text"
                  value={formData.roster_lock_time}
                  onChange={(e) => setFormData({ ...formData, roster_lock_time: e.target.value })}
                  className="w-full bg-[#0B0E16] border border-[#242C3D] p-2.5 rounded text-white focus:border-[#E56A10] outline-none"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[#94A3B8] uppercase">Description & Summary</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0B0E16] border border-[#242C3D] p-2.5 rounded text-white focus:border-[#E56A10] outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-[#242C3D] text-[#94A3B8] rounded hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#E56A10] text-white rounded font-bold uppercase hover:bg-[#D45900]"
                >
                  Submit & Create Draft
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 3. Tournaments List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-headline text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F59E0B]" />
              <span>Tournaments Managed by You ({tournaments.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-[#94A3B8] bg-[#161A24] border border-[#242C3D] rounded-xl animate-pulse">
              Querying organizer tournament allocations...
            </div>
          ) : tournaments.length === 0 ? (
            <div className="p-12 text-center bg-[#161A24] border border-[#242C3D] rounded-xl space-y-3">
              <Trophy className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <p className="text-sm text-white font-bold font-headline">No Tournaments Created Yet</p>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto font-mono">
                Click &quot;Create Tournament&quot; above to launch your first sanctioned competitive cup.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10]/50 rounded-xl p-5 space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold">
                        {t.game_name} • {t.format}
                      </span>
                      <h3 className="text-base font-bold text-white font-headline mt-0.5">
                        {t.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        t.status === "LIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : t.status === "REGISTRATION_OPEN"
                          ? "bg-[#E56A10]/20 text-[#FFB68F] border border-[#E56A10]/30"
                          : "bg-[#242C3D] text-[#94A3B8]"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#242C3D] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase block">Prize Pool</span>
                      <span className="text-white font-bold">{t.prize_pool}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase block">Teams Enrolled</span>
                      <span className="text-white font-bold">
                        {t.registered_teams} / {t.max_teams}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase block">Schedule</span>
                      <span className="text-[#CBD5E1] text-[11px] truncate block">{t.starts_at}</span>
                    </div>
                  </div>

                  {/* Actions according to lifecycle */}
                  <div className="flex items-center gap-2 pt-1">
                    {t.status === "DRAFT" && (
                      <button
                        onClick={() => handlePublish(t.id)}
                        className="px-3 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold rounded flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish (Open Reg)</span>
                      </button>
                    )}

                    {t.status === "REGISTRATION_OPEN" && (
                      <button
                        onClick={() => handleGenerateBracket(t.id)}
                        className="px-3 py-1.5 bg-[#F59E0B] hover:bg-amber-600 text-slate-900 text-xs font-mono font-bold rounded flex items-center gap-1.5 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Generate Bracket & Go Live</span>
                      </button>
                    )}

                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="px-3 py-1.5 bg-[#10141F] border border-[#242C3D] hover:text-white text-[#94A3B8] text-xs font-mono rounded flex items-center gap-1.5 transition-colors ml-auto"
                    >
                      <span>Public Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
