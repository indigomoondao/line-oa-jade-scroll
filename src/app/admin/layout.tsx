import { AdminHeader } from "@/app/admin/_components/admin-header";
import { config } from "@/config/config";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AdminHeader oaName={config.line.oaName} />
      {children}
    </main>
  );
}
