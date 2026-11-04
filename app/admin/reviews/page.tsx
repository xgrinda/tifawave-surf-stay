import Link from "next/link";
import { ReviewEditor } from "./editor";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminReviews,
  getGoogleReviewsReadiness,
} from "@/lib/admin/reviews";
import { AdminShell } from "../_components/admin-shell";
import { setReviewVisibility } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews | Tifawave Admin",
  description: "Protected Google reviews sync and review visibility overview.",
};

type AdminReviewsPageProps = {
  searchParams?: Promise<{
    error?: string;
    saved?: string;
    page?: string;
    q?: string;
    skipped?: string;
    synced?: string;
  }>;
};

function getMessage(params: Awaited<AdminReviewsPageProps["searchParams"]>) {
  if (params?.error) {
    return {
      tone: "error",
      text: params.error,
    };
  }

  if (params?.synced) {
    const skipped = Number(params.skipped ?? 0);
    const skippedText = skipped > 0 ? ` ${skipped} skipped.` : "";

    return {
      tone: "success",
      text: `${params.synced} Google reviews synced.${skippedText}`,
    };
  }

  return null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusText(value: boolean) {
  return value ? "Ready" : "Missing";
}

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  await requireAdmin("owner");

  const params = await searchParams;
  const [result, readiness] = await Promise.all([
    getAdminReviews(params),
    getGoogleReviewsReadiness(),
  ]);
  const reviews = result.rows;
  const message = getMessage(params);

  return (
    <AdminShell
      active="reviews"
      className="admin-reviews-page"
      description="Manage review sources and the homepage Google link."
      title="Reviews"
    >
      <section
        className="admin-panel-section"
        aria-labelledby="review-sync-title"
      >
        <div className="admin-section-heading">
          <div>
            <h2 id="review-sync-title">Google reviews connection</h2>
            <p>
              The homepage uses a Google profile link without copying review
              data. No API is called and no Google billing is enabled. Rating
              and review cards require an authorized provider; credentials are
              not configured.
            </p>
          </div>
          {message ? (
            <p
              className={`admin-form-message admin-form-message-${message.tone}`}
            >
              {message.text}
            </p>
          ) : null}
        </div>

        <div className="admin-review-sync-grid">
          <div className="admin-review-sync-card">
            <span>OAuth env vars</span>
            <strong>{statusText(readiness.envConfigured)}</strong>
          </div>
          <div className="admin-review-sync-card">
            <span>Google account ID</span>
            <strong>{statusText(readiness.accountConfigured)}</strong>
          </div>
          <div className="admin-review-sync-card">
            <span>Google location ID</span>
            <strong>{statusText(readiness.locationConfigured)}</strong>
          </div>
          <div className="admin-review-sync-card">
            <span>Profile URL</span>
            <strong>
              {readiness.profileUrlConfigured ? "Linked" : "Optional"}
            </strong>
          </div>
        </div>

        <div className="admin-review-sync-actions">
          <Link
            className="btn btn-primary"
            href="/admin/settings#google-reviews"
          >
            Configure homepage reviews
          </Link>
          <p>
            Historical import is paused. Stored or manually entered reviews are
            not used as Google rating or review cards. Keep original reviews
            only with the necessary permission; never copy Google reviews here.
            A future integration needs identity verification, attribution,
            retention rules and Owner approval before any billable API is
            enabled.
          </p>
        </div>
      </section>

      {params?.saved && <p role="status">Review saved.</p>}
      <section className="desk-panel">
        <h2>Original reviews archive</h2>
        <p>
          Never create sample reviews or alter the meaning of a guest’s words.
          New reviews stay hidden unless explicitly published.
        </p>
        <ReviewEditor />
      </section>
      <section
        className="admin-panel-section"
        aria-labelledby="reviews-list-title"
      >
        <div className="admin-section-heading">
          <div>
            <h2 id="reviews-list-title">Reviews · {result.count}</h2>
            <form className="desk-actions">
              <label className="admin-field">
                <span>Search guest name</span>
                <input name="q" defaultValue={result.q} maxLength={80} />
              </label>
              <button className="btn btn-secondary">Search</button>
              <Link href="/admin/reviews">Clear</Link>
            </form>
            <p>
              Stored original-review records are retained. The homepage Google
              section links directly to Google and does not display these rows.
            </p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="admin-bookings-table-wrap">
            <table className="admin-bookings-table admin-reviews-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td data-label="Guest">
                      <strong>{review.reviewerName || "Guest"}</strong>
                      <span className="admin-booking-subtext">
                        {formatDate(review.reviewDate)}
                      </span>
                    </td>
                    <td data-label="Rating">
                      <span className="admin-status-pill">
                        {review.rating}/5
                      </span>
                    </td>
                    <td data-label="Review">
                      <p className="admin-review-text">
                        {review.reviewText || "No written review text."}
                      </p>
                    </td>
                    <td data-label="Source">
                      {review.sourceUrl ? (
                        <a href={review.sourceUrl}>{review.source}</a>
                      ) : (
                        review.source
                      )}
                      {review.externalReviewId ? (
                        <span className="admin-booking-subtext">
                          {review.externalReviewId}
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`admin-status-pill${
                          review.active ? "" : " admin-status-muted"
                        }`}
                      >
                        {review.active ? "Active" : "Hidden"}
                      </span>
                      <form action={setReviewVisibility}>
                        <input name="id" type="hidden" value={review.id} />
                        <input
                          name="updated_at"
                          type="hidden"
                          value={review.updatedAt}
                        />
                        <input
                          name="active"
                          type="hidden"
                          value={String(!review.active)}
                        />
                        <button>{review.active ? "Hide" : "Publish"}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <strong>No reviews synced yet.</strong>
            <p>
              Set the genuine Google profile link in Settings to show the
              compact homepage section. No copied reviews are required.
            </p>
          </div>
        )}
      </section>
      <div className="desk-actions">
        {result.page > 1 && (
          <Link
            href={
              "?" +
              new URLSearchParams({
                page: String(result.page - 1),
                q: result.q,
              })
            }
          >
            Previous
          </Link>
        )}
        {result.page * 25 < result.count && (
          <Link
            href={
              "?" +
              new URLSearchParams({
                page: String(result.page + 1),
                q: result.q,
              })
            }
          >
            Next
          </Link>
        )}
      </div>
      {reviews
        .filter((r) => r.source === "manual")
        .map((r) => (
          <details className="desk-panel" key={r.id}>
            <summary>Edit original review · {r.reviewerName}</summary>
            <ReviewEditor review={r} />
          </details>
        ))}
    </AdminShell>
  );
}
