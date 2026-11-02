import type { AdminReview } from "@/lib/admin/reviews";
import { saveManualReview } from "./actions";
export function ReviewEditor({ review }: { review?: AdminReview }) {
  return (
    <form action={saveManualReview} className="desk-editor">
      <input name="id" type="hidden" value={review?.id || ""} />
      <input name="updated_at" type="hidden" value={review?.updatedAt || ""} />
      <div className="admin-settings-grid">
        <label className="admin-field">
          <span>Guest display name</span>
          <input
            name="reviewer_name"
            required
            maxLength={120}
            defaultValue={review?.reviewerName}
          />
        </label>
        <label className="admin-field">
          <span>Rating (1–5)</span>
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={review?.rating}
          />
        </label>
        <label className="admin-field">
          <span>Original review date</span>
          <input
            name="review_date"
            type="date"
            required
            defaultValue={review?.reviewDate.slice(0, 10)}
          />
        </label>
        <label className="admin-field">
          <span>Original source URL</span>
          <input
            name="source_url"
            type="url"
            required
            defaultValue={review?.sourceUrl}
          />
        </label>
      </div>
      <label className="admin-field">
        <span>Exact original review text</span>
        <textarea
          name="review_text"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          defaultValue={review?.reviewText}
        />
      </label>
      <label>
        <input type="checkbox" name="verified" required /> I verified the
        original review and have permission to display it.
      </label>
      <label>
        <input
          type="checkbox"
          name="active"
          defaultChecked={review?.active || false}
        />{" "}
        Publish this review
      </label>
      <button className="btn btn-primary">
        {review ? "Save verified review" : "Save verified guest review"}
      </button>
    </form>
  );
}
