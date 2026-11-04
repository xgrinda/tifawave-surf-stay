import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getWebsiteSettings } from "@/lib/settings";
import { ReviewsPanel } from "./reviews-panel";

export async function ReviewsSection({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
}) {
  const settings = await getWebsiteSettings();
  return <ReviewsPanel locale={locale} settings={settings} />;
}
