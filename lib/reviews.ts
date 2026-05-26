import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Row } from "@/lib/supabase/types";

type PublicReviewRow = Pick<
  Row<"reviews">,
  | "id"
  | "source"
  | "reviewer_name"
  | "rating"
  | "review_text"
  | "review_date"
  | "source_url"
>;

export type PublicReview = {
  id: string;
  source: "google" | "manual";
  reviewerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  sourceUrl: string;
};

function rowToPublicReview(review: PublicReviewRow): PublicReview {
  return {
    id: review.id,
    source: review.source,
    reviewerName: review.reviewer_name,
    rating: review.rating,
    reviewText: review.review_text,
    reviewDate: review.review_date,
    sourceUrl: review.source_url
  };
}

export async function getActiveReviews(limit = 3): Promise<PublicReview[]> {
  noStore();

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, source, reviewer_name, rating, review_text, review_date, source_url"
      )
      .eq("active", true)
      .neq("review_text", "")
      .order("review_date", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return data.map((review) => rowToPublicReview(review));
  } catch {
    return [];
  }
}
