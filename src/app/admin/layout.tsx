import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/app/admin/_components/admin-header";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSession,
} from "@/auth/admin";
import { config } from "@/config/config";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!verifyAdminSession(session)) {
    redirect("/access");
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AdminHeader oaName={config.line.oaName} />
      {children}
    </main>
  );
}
