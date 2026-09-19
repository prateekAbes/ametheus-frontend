import Link from "next/link";
import { ShieldAlert, ArrowLeft, Trophy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-[#F8F9FF] dark:bg-[#0B0E16] text-[#0F172A] dark:text-white transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-[#E56A10]/10 border border-[#E56A10]/30 flex items-center justify-center text-[#E56A10] mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono font-bold text-[#E56A10] tracking-widest uppercase mb-1">
        404 // ARENA COORDINATES NOT FOUND
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold font-headline mb-3 text-[#0F172A] dark:text-white">
        Match Zone Offline
      </h1>
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mb-8">
        The requested arena page, tournament bracket, or match lobby could not be located in the AMETHEUS competitive registry.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/tournaments"
          className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded transition-colors shadow-xs flex items-center gap-2"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Browse Tournaments</span>
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white dark:bg-[#161A24] border border-[#CBD5E1] dark:border-[#242C3D] text-[#0F172A] dark:text-white text-xs font-mono font-bold uppercase rounded hover:bg-[#F1F3F5] dark:hover:bg-[#202534] transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
