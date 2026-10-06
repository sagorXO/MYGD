import { redirect } from "next/navigation";

// The redesigned home now lives at "/". This stub only keeps old links working;
// delete this folder when convenient: git rm -r src/app/dev/preview
export default function HomePreviewMoved() {
  redirect("/");
}
