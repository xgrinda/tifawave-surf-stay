import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminReviews,
  getGoogleReviewsReadiness
} from "@/lib/admin/reviews";
import { AdminShell } from "../_components/admin-shell";
import { syncGoogleReviewsAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews | Tifawave Admin",
  description: "Protected Google reviews sync and review visibility overview."
};

type AdminReviewsPageProps = {
  searchParams?: Promise<{
    error?: string;
    skipped?: string;
    synced?: string;
  }>;
};

function getMessage(params: Awaited<AdminReviewsPageProps["searchParams"]>) {
  if (params?.error) {
    return {
      tone: "error",
      text: params.error
    };
  }

  if (params?.synced) {
    const skipped = Number(params.skipped ?? 0);
    const skippedText = skipped > 0 ? ` ${skipped} skipped.` : "";

    return {
      tone: "success",
      text: `${params.synced} Google reviews synced.${skippedText}`
    };
  }

  return null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function statusText(value: boolean) {
  return value ? "Ready" : "Missing";
}

export default async function AdminReviewsPage({
  searchParams
}: AdminReviewsPageProps) {
  await requireAdmin();

  const [params, reviews, readiness] = await Promise.all([
    searchParams,
    getAdminReviews(),
    getGoogleReviewsReadiness()
  ]);
  const message = getMessage(params);

  return (
    <AdminShell
      active="reviews"
      className="admin-reviews-page"
      description="Sync official Google Business Profile reviews and keep public review display honest."
      title="Reviews"
    >
      <section className="admin-panel-section" aria-labelledby="review-sync-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="review-sync-title">Google reviews sync</h2>
            <p>
              Uses the official Google Business Profile API with server-only
              OAuth credentials. No scraping and no browser API keys.
            </p>
          </div>
          {message ? (
            <p className={`admin-form-message admin-form-message-${message.tone}`}>
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
          <form action={syncGoogleReviewsAction}>
            <button
              className="btn btn-primary admin-settings-submit"
              disabled={!readiness.ready}
              type="submit"
            >
              Sync Google reviews
            </button>
          </form>
          <p>
            Configure IDs in Settings and env vars in Vercel before syncing.
            Manual fallback rows can still be added directly in Supabase with{" "}
            <code>source=manual</code> and <code>active=true</code>.
          </p>
        </div>
      </section>

      <section className="admin-panel-section" aria-labelledby="reviews-list-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="reviews-list-title">Synced reviews</h2>
            <p>Active written reviews can appear on the homepage.</p>
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
              Once Google sync is configured, use the button above to import
              official reviews into Supabase.
            </p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
