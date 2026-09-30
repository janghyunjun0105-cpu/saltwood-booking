import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Staff dashboard",
    template: "%s · Saltwood Staff",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
