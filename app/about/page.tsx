export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      <section className="w-full bg-[#EFF4FF] py-12 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5EEFF] border border-[#CBD5E1] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3">
            AMETHEUS ESPORTS PLATFORM
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-headline text-[#0B1C30] uppercase">
            About AMETHEUS
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#565E74] max-w-2xl leading-relaxed">
            The sanctioned esports tournament platform built for competitive integrity, automated bracket seeding, and verified escrow prize distribution.
          </p>
        </div>
      </section>
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 space-y-8 text-sm text-[#565E74]">
        <div className="bg-white p-8 rounded border border-[#D3E4FE] shadow-sm space-y-4">
          <h2 className="text-xl font-headline font-bold text-[#0B1C30] uppercase">
            The Solar Vanguard Standard
          </h2>
          <p className="leading-relaxed">
            AMETHEUS combines nocturnal arena intensity with daylight operational clarity. Designed from the ground up for tournament captains, competitive players, and sanctioned tournament arbiters.
          </p>
        </div>
      </main>
    </div>
  );
}
