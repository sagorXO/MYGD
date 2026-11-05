"use client";

import React from "react";
import { StaffHaccpHub } from "@/modules/haccp/components/StaffHaccpHub";
import Link from "next/link";
import { buttonClasses, SurfaceRoot } from "@/ui";

export default function StaffHubPage() {
  return (
    <SurfaceRoot surface="staff" className="min-h-screen bg-[#F7F7F8] p-6 sm:p-10">
      <div className="mb-6">
        <Link href="/staff/checklists" className={buttonClasses({ variant: "primary", size: "xl" })}>
          Open shift checklists
        </Link>
      </div>
      <StaffHaccpHub />
    </SurfaceRoot>
  );
}
