import { getGoogleBusinessProfileEnv } from "@/lib/env";
import { getWebsiteSettings } from "@/lib/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/lib/supabase/types";

type AdminReviewRow = Pick<
  Row<"reviews">,
  | "id"
  | "source"
  | "external_review_id"
  | "reviewer_name"
  | "rating"
  | "review_text"
  | "review_date"
  | "source_url"
  | "active"
  | "updated_at"
>;

export type AdminReview = {
  id: string;
  source: "google" | "manual";
  externalReviewId: string | null;
  reviewerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  sourceUrl: string;
  active: boolean;
  updatedAt: string;
};

export type GoogleReviewsReadiness = {
  accountConfigured: boolean;
  envConfigured: boolean;
  locationConfigured: boolean;
  profileUrlConfigured: boolean;
  ready: boolean;
};

function rowToAdminReview(review: AdminReviewRow): AdminReview {
  return {
    active: review.active,
    externalReviewId: review.external_review_id,
    id: review.id,
    rating: review.rating,
    reviewDate: review.review_date,
    reviewerName: review.reviewer_name,
    reviewText: review.review_text,
    source: review.source,
    sourceUrl: review.source_url,
    updatedAt: review.updated_at
  };
}

export async function getAdminReviews(limit = 50): Promise<AdminReview[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, source, external_review_id, reviewer_name, rating, review_text, review_date, source_url, active, updated_at"
    )
    .order("review_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((review) => rowToAdminReview(review));
}

export async function getGoogleReviewsReadiness(): Promise<GoogleReviewsReadiness> {
  const [settings, env] = await Promise.all([
    getWebsiteSettings(),
    Promise.resolve(getGoogleBusinessProfileEnv())
  ]);
  const accountConfigured = Boolean(settings.googleBusinessAccountId);
  const locationConfigured = Boolean(settings.googleBusinessLocationId);
  const profileUrlConfigured = Boolean(settings.googleReviewsProfileUrl);

  return {
    accountConfigured,
    envConfigured: env.configured,
    locationConfigured,
    profileUrlConfigured,
    ready: accountConfigured && locationConfigured && env.configured
  };
}
