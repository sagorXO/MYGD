import { SurfaceRoot } from "@/ui";
import { ChecklistApp } from "@/modules/checklists/components/ChecklistApp";

export const metadata = { title: "Shift checklists — MYGD" };

export default function StaffChecklistsPage() {
  return (
    <SurfaceRoot surface="staff">
      <ChecklistApp />
    </SurfaceRoot>
  );
}
