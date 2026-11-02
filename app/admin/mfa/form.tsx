"use client";
import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { enrollFactor, verifyFactor, type MfaState } from "./actions";
export function MfaForm({ verifiedFactor }: { verifiedFactor?: string }) {
  const [enrollment, setEnrollment] = useState<MfaState>({});
  const [enrolling, startEnrollment] = useTransition();
  const [state, verify, pending] = useActionState(verifyFactor, {});
  const factorId = verifiedFactor || enrollment.factorId || state.factorId;
  return (
    <>
      <p>Owner actions require an authenticator code.</p>
      {!verifiedFactor && !enrollment.factorId && (
        <button
          className="btn btn-primary"
          disabled={enrolling}
          onClick={() =>
            startEnrollment(async () => setEnrollment(await enrollFactor()))
          }
        >
          {enrolling ? "Preparing…" : "Set up authenticator"}
        </button>
      )}
      {enrollment.qrCode && (
        <>
          <p>
            Scan this private code with your authenticator, then enter its
            six-digit code.
          </p>
          <Image
            unoptimized
            width={240}
            height={240}
            alt="Private authenticator enrollment QR code"
            src={
              enrollment.qrCode.startsWith("data:")
                ? enrollment.qrCode
                : "data:image/svg+xml;charset=utf-8," +
                  encodeURIComponent(enrollment.qrCode)
            }
          />
        </>
      )}
      {factorId && (
        <form action={verify} className="admin-login-form">
          <input type="hidden" name="factorId" value={factorId} />
          <label className="admin-field">
            Authenticator code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </label>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "Verifying…" : "Verify identity"}
          </button>
        </form>
      )}
      {(enrollment.error || state.error) && (
        <p role="alert" className="admin-error">
          {enrollment.error || state.error}
        </p>
      )}
    </>
  );
}
