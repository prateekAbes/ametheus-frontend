"use client";

import React from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SOCIAL_LINKS } from "@/lib/constants/support";
import AmetheusLogo from "@/components/ui/AmetheusLogo";

export default function Footer() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { profile } = useAuthContext();

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isHardcodedAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg";
  const userRole = profile?.role;
  const hasPrivileges = isHardcodedAdmin || userRole === "SUPER_ADMIN" || userRole === "ORGANIZER";

  return (
    <footer className="bg-[#0B0E16] text-[#F8FAFC] border-t border-[#242C3D] mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <AmetheusLogo className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.02]" />
            </Link>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Tier-1 competitive esports tournament infrastructure. Built for athletes, organizers, and professional contenders.
            </p>
            <span className="inline-block text-[#E56A10] font-bold text-xs tracking-widest uppercase">
              ENTER THE COMPETITION.
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">
              Platform
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-[#94A3B8]">
              <li>
                <Link href="/games" className="hover:text-white transition-colors">
                  Games Directory
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-white transition-colors">
                  Active Tournaments
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-white transition-colors">
                  Global Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-white transition-colors">
                  Live Match Ticker
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">
              Support
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-[#94A3B8]">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Wallet &amp; Payments Help
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Tournament Rules
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support Desk
                </Link>
              </li>
              <li className="pt-2 text-xs text-[#CBD5E1] font-mono flex flex-col gap-1.5">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="hover:text-[#E56A10] transition-colors flex items-center gap-1.5"
                  aria-label="Email Support"
                >
                  <span className="text-[#E56A10]">✉</span> {SUPPORT_EMAIL}
                </a>
                {SUPPORT_PHONE ? (
                  <a
                    href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`}
                    className="hover:text-[#E56A10] transition-colors flex items-center gap-1.5"
                    aria-label="Phone Support"
                  >
                    <span className="text-[#E56A10]">☎</span> {SUPPORT_PHONE}
                  </a>
                ) : null}
              </li>
            </ul>
          </div>

          {/* Community & Official Handles */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">
              Community &amp; Social
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-[#94A3B8]">
              <li>
                <a
                  href={SOCIAL_LINKS.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[#5865F2] font-bold">●</span> Discord Official
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[#E1306C] font-bold">●</span> Instagram (@ametheus.gg)
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[#FF0000] font-bold">●</span> YouTube Channel
                </a>
              </li>
              {hasPrivileges && (
                <li className="pt-2">
                  <Link href="/admin" className="text-xs text-[#E56A10] hover:underline font-mono font-medium">
                    Organizer / Admin Portal →
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#242C3D] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© 2026 AMETHEUS Esports Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/help" className="hover:text-[#94A3B8]">
              Terms of Competition
            </Link>
            <Link href="/help" className="hover:text-[#94A3B8]">
              Privacy Policy
            </Link>
            <Link href="/help" className="hover:text-[#94A3B8]">
              Security &amp; Integrity
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
