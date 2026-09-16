export default function HelpPage() {
  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      <section className="w-full bg-[#EFF4FF] py-12 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5EEFF] border border-[#CBD5E1] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3">
            PLAYER SUPPORT & DISPUTE PROTOCOL
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-headline text-[#0B1C30] uppercase">
            Platform Help Center
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#565E74] max-w-2xl leading-relaxed">
            Learn about team formation, tournament registration, match result evidence standards, and fair play dispute escalation.
          </p>
        </div>
      </section>
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 space-y-6 text-sm text-[#565E74]">
        <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
            How do I form a team?
          </h3>
          <p className="leading-relaxed">
            Team creation is strictly anchored inside game hubs (e.g. Games → Valorant → Create Team). Once created, captains receive a unique 6-character code (e.g. SR7X4K) which teammates use to join for ₹0.
          </p>
        </div>
        <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
            How are match disputes resolved?
          </h3>
          <p className="leading-relaxed">
            Tournament Admins review screenshot scoreboard uploads and in-game server logs. If fraudulent scores are detected, the offending roster is disqualified and reported to platform arbiters.
          </p>
        </div>
      </main>
    </div>
  );
}
