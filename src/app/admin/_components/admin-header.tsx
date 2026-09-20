type AdminHeaderProps = Readonly<{
  oaName: string;
}>;

export function AdminHeader({ oaName }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto w-full max-w-360 px-4 py-5 sm:px-6">
        <h1 className="font-heading text-[28px] leading-none font-semibold tracking-[-0.02em] text-foreground">
          {oaName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">LINE OA inbox</p>
      </div>
    </header>
  );
}
