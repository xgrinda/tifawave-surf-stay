"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { changeOwnPassword, sendRecovery } from "@/app/admin/setup/actions";
export function AccountForm({
  recovery = false,
  signedIn = false,
  needsMfa = false,
}: {
  recovery?: boolean;
  signedIn?: boolean;
  needsMfa?: boolean;
}) {
  const [state, action, pending] = useActionState(
    recovery ? sendRecovery : changeOwnPassword,
    {},
  );
  const [bootstrap, setBootstrap] = useState("");
  const initialized = useRef(false);
  useEffect(() => {
    if (recovery || initialized.current) return;
    initialized.current = true;
    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.slice(1));
    const code = query.get("code"),
      access = hash.get("access_token"),
      refresh = hash.get("refresh_token");
    const error = hash.get("error");
    history.replaceState(null, "", location.pathname);
    if (!code && !(access && refresh)) {
      if (error)
        queueMicrotask(() =>
          setBootstrap("This link is expired. Request a new recovery link."),
        );
      return;
    }
    void (async () => {
      try {
        const response = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            code ? { code } : { access_token: access, refresh_token: refresh },
          ),
        });
        if (!response.ok) throw Error();
        location.replace(location.pathname);
      } catch {
        setBootstrap(
          "This invitation or recovery link is invalid or expired. Request a new link.",
        );
      }
    })();
  }, [recovery]);
  return (
    <form action={action} className="admin-login-form">
      {recovery ? (
        <label className="admin-field">
          <span>Staff email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
          />
        </label>
      ) : signedIn && !state.success ? (
        <>
          <label className="admin-field">
            <span>New password</span>
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="admin-field">
            <span>Confirm password</span>
            <input
              name="confirm"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          {needsMfa && (
            <label className="admin-field">
              <span>Authenticator code</span>
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                required
              />
            </label>
          )}
        </>
      ) : !state.success ? (
        <p>
          Open your invitation or recovery link, or sign in to change your
          password.
        </p>
      ) : null}
      {(bootstrap || state.message) && (
        <p role="status">{bootstrap || state.message}</p>
      )}
      {(recovery || signedIn) && !state.success && (
        <button className="btn btn-primary" disabled={pending}>
          {pending
            ? "Please wait…"
            : recovery
              ? "Send recovery link"
              : "Save new password"}
        </button>
      )}
      <Link href="/admin/login">Back to staff sign in</Link>
    </form>
  );
}
