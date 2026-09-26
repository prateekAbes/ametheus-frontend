"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";
import { getCurrentUserProfile } from "@/lib/api/auth";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/constants/support";

export default function Footer() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      getCurrentUserProfile()
        .then((profile) => setUserRole(profile.role))
        .catch(() => {
          // If network fails, keep null
        });
    } else {
      setUserRole(null);
    }
  }, [isSignedIn]);

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isHardcodedAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg";
  const hasPrivileges = isHardcodedAdmin || userRole === "SUPER_ADMIN" || userRole === "ORGANIZER";

  return (
    <footer className="bg-[#0B0E16] text-[#F8FAFC] border-t border-[#242C3D] mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/ametheus-logo.svg"
                alt="AMETHEUS"
                width={160}
                height={38}
                className="h-8 w-auto object-contain"
              />
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

          {/* Help & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">
              Help & Support
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-[#94A3B8]">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Wallet & Payments Help
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Tournament Rules
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li className="pt-2 text-xs text-[#CBD5E1] font-mono flex flex-col gap-1">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-[#E56A10] transition-colors flex items-center gap-1.5">
                  <span>✉</span> {SUPPORT_EMAIL}
                </a>
                <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`} className="hover:text-[#E56A10] transition-colors flex items-center gap-1.5">
                  <span>☎</span> {SUPPORT_PHONE}
                </a>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Report Dispute
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Rules */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">
              Fair Play & Support
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-[#94A3B8]">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Rules & Dispute System
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Anti-Cheat Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              {/* Strictly hidden unless authorized */}
              {hasPrivileges && (
                <li>
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
              Security & Integrity
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
