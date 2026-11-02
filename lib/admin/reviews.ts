import { getGoogleBusinessProfileEnv } from "@/lib/env";
import { getWebsiteSettings } from "@/lib/settings";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
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
    updatedAt: review.updated_at,
  };
}

export async function getAdminReviews(
  params: { page?: string; q?: string } = {},
) {
  const supabase = await createSupabaseStaffClient();
  const page = Math.max(1, Math.min(10000, parseInt(params.page || "1") || 1));
  const q = (params.q || "").replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 80);
  let query = supabase
    .from("reviews")
    .select(
      "id,source,external_review_id,reviewer_name,rating,review_text,review_date,source_url,active,updated_at",
      { count: "exact" },
    )
    .order("review_date", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (q) query = query.ilike("reviewer_name", "%" + q + "%");
  const { data, error, count } = await query;
  if (error) throw Error("Reviews unavailable");
  return { rows: data.map(rowToAdminReview), count: count || 0, page, q };
}

export async function getGoogleReviewsReadiness(): Promise<GoogleReviewsReadiness> {
  const [settings, env] = await Promise.all([
    getWebsiteSettings(),
    Promise.resolve(getGoogleBusinessProfileEnv()),
  ]);
  const accountConfigured = Boolean(settings.googleBusinessAccountId);
  const locationConfigured = Boolean(settings.googleBusinessLocationId);
  const profileUrlConfigured = Boolean(settings.googleReviewsProfileUrl);

  return {
    accountConfigured,
    envConfigured: env.configured,
    locationConfigured,
    profileUrlConfigured,
    ready: accountConfigured && locationConfigured && env.configured,
  };
}
