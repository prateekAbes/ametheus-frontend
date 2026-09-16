'use client';

import React, { useState } from "react";
import { MatchLobbyInfo } from "@/types";
import { X, UploadCloud, CheckCircle, ShieldAlert, FileText, Check } from "lucide-react";

interface Props {
  match: MatchLobbyInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EvidenceSubmissionModal({ match, isOpen, onClose, onSuccess }: Props) {
  const [scoreA, setScoreA] = useState("13");
  const [scoreB, setScoreB] = useState("9");
  const [notes, setNotes] = useState("Clean game, all players checked in on Mumbai AWS server.");
  const [uploadedFile, setUploadedFile] = useState<string | null>("valorant_match_end_scoreboard.png");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !match) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onSuccess();
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B0E16] text-[#F8FAFC] border border-[#242C3D] w-full max-w-xl rounded shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#242C3D] bg-[#10141F]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#E56A10]/20 border border-[#E56A10]/40 text-[#E56A10] text-[10px] font-mono font-bold rounded">
              RESULT EVIDENCE AUDIT
            </div>
            <h3 className="text-xl font-bold font-headline text-white mt-1 uppercase">
              Submit Match Score & Proof
            </h3>
            <p className="text-xs text-[#94A3B8] font-mono">{match.stage}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-white hover:bg-[#161A24] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-600 flex items-center justify-center text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold font-headline text-white uppercase">
              Result Evidence Stored in Audit Vault
            </h4>
            <p className="text-xs text-[#94A3B8] max-w-md leading-relaxed font-mono">
              Scores recorded. Tournament Admins will cross-verify the evidence screenshot and advance the tournament bracket tree.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Score Inputs */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-2 font-bold">
                Final Match Score
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#10141F] border border-[#242C3D] p-3 rounded">
                  <div className="text-xs font-bold text-white mb-1">{match.teamA.name}</div>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    required
                    className="w-full bg-[#0B0E16] border border-[#242C3D] px-3 py-2 text-xl font-bold font-mono text-white rounded focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div className="bg-[#10141F] border border-[#242C3D] p-3 rounded">
                  <div className="text-xs font-bold text-white mb-1">{match.teamB.name}</div>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    required
                    className="w-full bg-[#0B0E16] border border-[#242C3D] px-3 py-2 text-xl font-bold font-mono text-white rounded focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>
            </div>

            {/* Screenshot Evidence Upload Simulation */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-2 font-bold">
                Match End Scoreboard Screenshot (Cloudflare R2)
              </label>
              <div className="border-2 border-dashed border-[#242C3D] hover:border-[#E56A10] bg-[#10141F] p-5 rounded text-center transition-colors">
                <UploadCloud className="w-8 h-8 text-[#E56A10] mx-auto mb-2" />
                <div className="text-xs font-bold text-white mb-1">
                  {uploadedFile ? uploadedFile : "Click or drag match screenshot here"}
                </div>
                <div className="text-[11px] text-[#94A3B8] font-mono">
                  PNG, JPG up to 15MB • Shows complete in-game scoreboard with final round score
                </div>
                {uploadedFile && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
                    <CheckCircle className="w-3 h-3" /> VERIFIED IMAGE ATTACHED
                  </span>
                )}
              </div>
            </div>

            {/* Captain Match Notes */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-2 font-bold">
                Captain Observations / Anti-Cheat Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#10141F] border border-[#242C3D] p-3 text-xs text-white rounded focus:outline-none focus:border-[#E56A10] font-mono"
                placeholder="Describe match conduct, overtimes, or lobby details..."
              />
            </div>

            {/* Rules Note */}
            <div className="p-3 bg-[#161A24] border border-[#242C3D] rounded flex items-start gap-2 text-[11px] text-[#94A3B8]">
              <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <span>
                Submitting fraudulent match screenshots or falsified scores is grounds for permanent squad forfeiture and platform escrow blacklist.
              </span>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-[#94A3B8] hover:text-white rounded text-xs font-mono uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs rounded uppercase tracking-wider font-mono shadow-sm transition-all"
              >
                {isSubmitting ? "Cryptographically Hashing..." : "Confirm & Transmit Score"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
