import { AdminShell } from "@/components/admin/AdminShell";

export default function ProtectedAdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
