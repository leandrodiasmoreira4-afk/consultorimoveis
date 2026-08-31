import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { RegionCoverManager } from "@/components/admin/RegionCoverManager";

export const metadata: Metadata = {
  title: "Painel administrativo | Cristian Oliveira",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <><AdminPanel /><RegionCoverManager /></>;
}
