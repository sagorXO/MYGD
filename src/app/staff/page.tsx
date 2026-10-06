"use client";

import React from "react";
import { StaffHaccpHub } from "@/modules/haccp/components/StaffHaccpHub";
import { SurfaceRoot } from "@/ui";

export default function StaffHubPage() {
  return (
    <SurfaceRoot surface="staff" className="min-h-screen bg-[#F7F7F8] p-6 sm:p-10">
      <StaffHaccpHub />
    </SurfaceRoot>
  );
}
