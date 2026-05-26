import { getGoogleBusinessProfileEnv } from "@/lib/env";
import { getWebsiteSettings } from "@/lib/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Insert } from "@/lib/supabase/types";

type GoogleStarRating =
  | "STAR_RATING_UNSPECIFIED"
  | "ONE"
  | "TWO"
  | "THREE"
  | "FOUR"
  | "FIVE";

type GoogleReview = {
  name?: string;
  reviewId?: string;
  reviewer?: {
    displayName?: string;
    isAnonymous?: boolean;
  };
  starRating?: GoogleStarRating;
  comment?: string;
  createTime?: string;
  updateTime?: string;
};

type GoogleReviewsResponse = {
  reviews?: GoogleReview[];
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleReviewsSyncResult = {
  ok: boolean;
  message: string;
  synced: number;
  skipped: number;
};

const STAR_RATINGS: Record<GoogleStarRating, number | null> = {
  STAR_RATING_UNSPECIFIED: null,
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5
};

function normalizeGoogleResourceId(value: string, resource: "accounts" | "locations") {
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");

  if (!normalized) {
    return "";
  }

  if (resource === "accounts") {
    return normalized.replace(/^accounts\//, "").split("/locations/")[0] ?? "";
  }

  if (normalized.includes("/locations/")) {
    return normalized.split("/locations/").at(-1) ?? "";
  }

  return normalized.replace(/^locations\//, "");
}

function reviewIdFromGoogleReview(review: GoogleReview): string {
  return review.reviewId ?? review.name?.split("/").at(-1) ?? "";
}

function ratingFromGoogleReview(review: GoogleReview): number | null {
  if (!review.starRating) {
    return null;
  }

  return STAR_RATINGS[review.starRating] ?? null;
}

function isoTimestamp(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

async function responseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  return text.slice(0, 280);
}

async function getGoogleAccessToken(): Promise<string> {
  const env = getGoogleBusinessProfileEnv();

  if (!env.configured) {
    throw new Error("Google Business Profile OAuth env vars are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      grant_type: "refresh_token",
      refresh_token: env.refreshToken
    })
  });

  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        "Google OAuth token refresh failed."
    );
  }

  return payload.access_token;
}

async function fetchLatestGoogleReviews({
  accessToken,
  accountId,
  locationId
}: {
  accessToken: string;
  accountId: string;
  locationId: string;
}): Promise<GoogleReview[]> {
  const parent = `accounts/${encodeURIComponent(accountId)}/locations/${encodeURIComponent(
    locationId
  )}`;
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/${parent}/reviews`
  );
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("orderBy", "updateTime desc");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  const payload = (await response.json()) as GoogleReviewsResponse;
  return payload.reviews ?? [];
}

function googleReviewToRow(
  review: GoogleReview,
  sourceUrl: string
): Insert<"reviews"> | null {
  const externalReviewId = reviewIdFromGoogleReview(review);
  const rating = ratingFromGoogleReview(review);

  if (!externalReviewId || !rating) {
    return null;
  }

  const reviewerName =
    review.reviewer?.isAnonymous || !review.reviewer?.displayName
      ? "Google guest"
      : review.reviewer.displayName.trim();

  return {
    active: true,
    external_review_id: externalReviewId,
    rating,
    review_date: isoTimestamp(review.createTime ?? review.updateTime),
    review_text: review.comment?.trim() ?? "",
    reviewer_name: reviewerName,
    source: "google",
    source_url: sourceUrl,
    updated_at: new Date().toISOString()
  };
}

export async function syncGoogleBusinessProfileReviews(): Promise<GoogleReviewsSyncResult> {
  const settings = await getWebsiteSettings();
  const accountId = normalizeGoogleResourceId(
    settings.googleBusinessAccountId,
    "accounts"
  );
  const locationId = normalizeGoogleResourceId(
    settings.googleBusinessLocationId,
    "locations"
  );

  if (!accountId || !locationId) {
    return {
      ok: false,
      message: "Add the Google account ID and location ID in Settings first.",
      skipped: 0,
      synced: 0
    };
  }

  if (!getGoogleBusinessProfileEnv().configured) {
    return {
      ok: false,
      message: "Google Business Profile OAuth env vars are not configured.",
      skipped: 0,
      synced: 0
    };
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const googleReviews = await fetchLatestGoogleReviews({
      accessToken,
      accountId,
      locationId
    });
    const sourceUrl = settings.googleReviewsProfileUrl || settings.googleMapsUrl;
    const rows = googleReviews
      .map((review) => googleReviewToRow(review, sourceUrl))
      .filter((review): review is Insert<"reviews"> => Boolean(review));

    if (rows.length === 0) {
      return {
        ok: true,
        message: "Google sync completed, but no usable reviews were returned.",
        skipped: googleReviews.length,
        synced: 0
      };
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("reviews")
      .upsert(rows, { onConflict: "source,external_review_id" });

    if (error) {
      return {
        ok: false,
        message: error.message,
        skipped: googleReviews.length - rows.length,
        synced: 0
      };
    }

    return {
      ok: true,
      message: `Synced ${rows.length} Google review${rows.length === 1 ? "" : "s"}.`,
      skipped: googleReviews.length - rows.length,
      synced: rows.length
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Google reviews sync failed.",
      skipped: 0,
      synced: 0
    };
  }
}
