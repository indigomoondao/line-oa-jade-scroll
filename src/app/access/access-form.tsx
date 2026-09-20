"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccessFormProps = Readonly<{
  hasInvalidToken: boolean;
}>;

export function AccessForm({ hasInvalidToken }: AccessFormProps) {
  const [token, setToken] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedToken = token.trim();

    if (!trimmedToken) {
      return;
    }

    window.location.replace(`/r/${encodeURIComponent(trimmedToken)}`);
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="access-token">
          Access token
        </label>
        <Input
          autoCapitalize="none"
          autoComplete="off"
          id="access-token"
          onChange={(event) => setToken(event.target.value)}
          spellCheck={false}
          type="password"
          value={token}
        />
      </div>
      {hasInvalidToken ? (
        <p className="text-sm text-destructive">Invalid access token.</p>
      ) : null}
      <Button className="w-full" disabled={!token.trim()} type="submit">
        Continue
      </Button>
    </form>
  );
}
