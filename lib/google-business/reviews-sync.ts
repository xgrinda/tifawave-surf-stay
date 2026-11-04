/** Historical import is deliberately paused. Link-only display makes no Google API calls.
 * Re-enabling provider data requires Owner authorization and compliant attribution,
 * retention, identity checks and cost controls; stored rows are not a live rating feed.
 */
export async function syncGoogleBusinessProfileReviews() {
  return {
    ok: false,
    message:
      "Google import is paused. Configure the homepage profile link in Settings. Live review cards require a separately approved, policy-compliant provider connection.",
    skipped: 0,
    synced: 0,
  };
}
