import type { Metadata } from "next";
import { SettingsPanel } from "@/components/admin/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 text-muted">
          Hours, table counts and closures. Online booking picks up changes as soon as you save.
        </p>
        <div className="mt-8">
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
}
