import type { Metadata } from "next";
import { ManageView } from "@/components/manage/ManageView";

export const metadata: Metadata = {
  title: "Manage your booking",
  description: "Change or cancel your Saltwood Kitchen booking with your booking code and email.",
  alternates: { canonical: "/manage" },
};

export default function ManagePage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <ManageView />
    </div>
  );
}
