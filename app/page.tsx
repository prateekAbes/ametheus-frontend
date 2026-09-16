import Link from "next/link";
import { Trophy, Users, Shield, ArrowRight, Flame, CheckCircle, Gamepad2 } from "lucide-react";

export default function HomePage() {
  const featuredTournaments = [
    {
      id: "val-open-s4",
      title: "VALORANT APEX CHALLENGERS — SEASON 4",
      game: "Valorant (5v5 PC)",
      gameSlug: "valorant",
      prizePool: "₹50,000",
      entryFee: "₹60 / Team",
      teamsRegistered: 14,
      maxTeams: 16,
      status: "REGISTRATION CLOSING",
      startsAt: "Today, 8:00 PM IST",
      badgeColor: "bg-[#E56A10] text-white",
    },
    {
      id: "cs2-masters-s1",
      title: "COUNTER-STRIKE 2 PRO DIVISION CUP",
      game: "Counter-Strike 2 (5v5 PC)",
      gameSlug: "counter-strike-2",
      prizePool: "₹35,000",
      entryFee: "₹50 / Team",
      teamsRegistered: 8,
      maxTeams: 16,
      status: "CHECK-IN OPEN",
      startsAt: "Tomorrow, 6:00 PM IST",
      badgeColor: "bg-[#F59E0B] text-slate-900 font-bold",
    },
    {
      id: "chess-rapid-masters",
      title: "AMETHEUS GRANDMASTER BLITZ #12",
      game: "Chess (1v1)",
      gameSlug: "chess",
      prizePool: "₹15,000",
      entryFee: "₹0 / Free",
      teamsRegistered: 32,
      maxTeams: 32,
      status: "BRACKET SEEDED",
      startsAt: "Live Now",
      badgeColor: "bg-[#10B981] text-white font-bold",
    },
  ];

  const featuredGames = [
    { name: "Valorant", tag: "5V5 TACTICAL PC", slug: "valorant", prizePool: "₹1,20,000", activeTournaments: 4 },
    { name: "Counter-Strike 2", tag: "5V5 PC", slug: "counter-strike-2", prizePool: "₹85,000", activeTournaments: 3 },
    { name: "Chess", tag: "1V1 BLITZ & RAPID", slug: "chess", prizePool: "₹40,000", activeTournaments: 6 },
    { name: "BGMI", tag: "BATTLE ROYALE MOBILE", slug: "bgmi", prizePool: "₹90,000", activeTournaments: 2 },
    { name: "Smash Karts", tag: "3D BATTLE ARENA", slug: "smash-karts", prizePool: "₹25,000", activeTournaments: 2 },
    { name: "Mini Militia", tag: "2D MULTIPLAYER", slug: "mini-militia", prizePool: "₹20,000", activeTournaments: 1 },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#0B0E16] text-[#F8FAFC] border-b border-[#242C3D] py-20 md:py-28 px-4 md:px-8">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-[1440px] mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161A24] border border-[#242C3D] rounded mb-6 text-[#E56A10] text-xs font-bold tracking-widest font-mono">
            <Flame className="w-4 h-4 text-[#E56A10]" />
            TIER-1 TOURNAMENT PLATFORM
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-headline max-w-4xl text-white">
            ENTER THE <span className="text-[#E56A10]">COMPETITION.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed">
            The next-generation competitive esports engine. Form your roster, claim your tournament slot, play verified matches, and compete for verified prize pools.
          </p>

          {/* Primary Operations CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tournaments"
              className="px-6 py-3 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-sm rounded uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              Browse Tournaments
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/games"
              className="px-6 py-3 bg-[#161A24] hover:bg-[#202634] text-[#F8FAFC] border border-[#242C3D] hover:border-[#E56A10] font-bold text-sm rounded uppercase tracking-wider transition-all"
            >
              Select Game Hub
            </Link>
          </div>

          {/* Live Telemetry Bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-[#242C3D]/60">
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-white tabular-nums">
                ₹3,50,000+
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Monthly Prize Pool
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-[#E56A10] tabular-nums">
                12
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Esports Disciplines
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-white tabular-nums">
                ₹0
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Team Join Cost
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-[#10B981] tabular-nums">
                100%
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Admin Verified Matches
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Tournaments (Daylight Canvas) */}
      <section className="py-16 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#E56A10] uppercase font-mono mb-1">
              Active Competitions
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A]">
              Featured Tournaments
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="text-xs font-bold uppercase tracking-wider text-[#0F172A] hover:text-[#E56A10] flex items-center gap-1.5 transition-colors"
          >
            View all tournaments
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredTournaments.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg p-6 flex flex-col justify-between transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`px-2 py-0.5 text-[10px] rounded font-mono ${t.badgeColor}`}>
                    {t.status}
                  </span>
                  <span className="text-xs text-[#64748B] font-mono">
                    {t.startsAt}
                  </span>
                </div>

                <h3 className="font-headline font-bold text-lg text-[#0F172A] leading-snug mb-2">
                  {t.title}
                </h3>

                <p className="text-xs text-[#64748B] font-mono mb-6">
                  {t.game}
                </p>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F1F3F5] mb-6">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                      Prize Pool
                    </span>
                    <span className="text-lg font-bold font-headline text-[#E56A10] tabular-nums">
                      {t.prizePool}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                      Entry Fee
                    </span>
                    <span className="text-lg font-bold font-headline text-[#0F172A] tabular-nums">
                      {t.entryFee}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#64748B] mb-4">
                  <span>Registered Slots:</span>
                  <span className="font-bold text-[#0F172A] font-mono">
                    {t.teamsRegistered} / {t.maxTeams} Teams
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-[#E56A10] rounded-full"
                    style={{ width: `${(t.teamsRegistered / t.maxTeams) * 100}%` }}
                  />
                </div>
              </div>

              <Link
                href={`/tournaments/${t.id}`}
                className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider rounded text-center transition-colors block"
              >
                View Tournament Details
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Games Directory Preview (Contextual Game Hub Entry) */}
      <section className="bg-[#F1F3F5] py-16 px-4 md:px-8 border-y border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-bold tracking-widest text-[#E56A10] uppercase font-mono mb-1">
                Contextual Competition
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A]">
                Disciplines & Dedicated Game Hubs
              </h2>
              <p className="text-sm text-[#64748B] mt-1 max-w-xl">
                Teams are formed directly inside each game hub. Select your title to create a team, generate your 6-character code, or register.
              </p>
            </div>
            <Link
              href="/games"
              className="text-xs font-bold uppercase tracking-wider text-[#0F172A] hover:text-[#E56A10] flex items-center gap-1.5 transition-colors"
            >
              Explore all 12 games
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGames.map((g) => (
              <div
                key={g.slug}
                className="bg-white border border-[#E2E8F0] hover:border-[#E56A10] rounded-lg p-6 flex flex-col justify-between transition-all group hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 bg-[#F1F3F5] text-[#475569] font-mono text-[10px] font-bold rounded">
                      {g.tag}
                    </span>
                    <span className="text-xs text-[#10B981] font-mono font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      {g.activeTournaments} Active
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-headline text-[#0F172A] group-hover:text-[#E56A10] transition-colors mb-1">
                    {g.name}
                  </h3>
                  <div className="text-xs text-[#64748B] font-mono mb-6">
                    Total Active Pool: <span className="font-bold text-[#0F172A]">{g.prizePool}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-[#F1F3F5]">
                  <Link
                    href={`/games/${g.slug}`}
                    className="flex-1 py-2 bg-[#F8F9FA] hover:bg-[#E56A10] hover:text-white text-[#0F172A] text-xs font-bold uppercase tracking-wider rounded text-center transition-colors border border-[#E2E8F0]"
                  >
                    Enter Hub
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How AMETHEUS Works */}
      <section className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-bold tracking-widest text-[#E56A10] uppercase font-mono mb-2">
            The Competitive Pipeline
          </div>
          <h2 className="text-3xl font-bold font-headline text-[#0F172A]">
            How AMETHEUS Works
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            From team creation to automated bracket advancement and verified prize payouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm">
              01
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] mb-2">
              Select Game & Form Team
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Navigate to your game hub. Create your team to become Captain and receive an instant 6-character code (e.g. <code className="font-mono font-bold text-[#0F172A]">SR7X4K</code>). Teammates join for ₹0.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm">
              02
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] mb-2">
              Register Tournament
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Choose an active tournament. Verify your roster eligibility, accept rules, and complete registration with secure Razorpay checkout (₹50–₹60).
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm">
              03
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] mb-2">
              Check-In & Play Match
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Check in 30 minutes before match time. Access lobby credentials, play your match, and submit end-screen evidence for admin score verification.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm">
              04
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] mb-2">
              Advance & Win Prizes
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Single-elimination engine auto-advances verified winners round-by-round. Earn points, rank on the global leaderboard, and claim verified cash payouts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
