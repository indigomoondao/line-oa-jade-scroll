import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSession,
} from "@/auth/admin";
import { config } from "@/config/config";
import { AccessForm } from "@/app/access/access-form";

type AccessPageProps = Readonly<{
  searchParams: Promise<{ error?: string }>;
}>;

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (verifyAdminSession(session)) {
    redirect("/admin");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-sm border border-border bg-card p-6 sm:p-8">
        <p className="font-heading text-2xl font-semibold text-foreground">
          Jade Scroll
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {config.line.oaName} · LINE OA inbox
        </p>
        <h1 className="mt-5 text-lg font-semibold text-foreground">
          Reviewer access
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter the access token supplied with this submission.
        </p>
        <AccessForm hasInvalidToken={error === "invalid-token"} />
      </section>
    </main>
  );
}
