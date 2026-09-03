import type { QueryClient } from "@tanstack/react-query";

// Every cache key that backs a stat/count/KPI shown somewhere in the app.
// Any action that changes an event's money, status, or an enquiry's
// existence should refresh ALL of these together — not just the one screen
// the action happened on. Missing one of these here is exactly how the
// Dashboard, Open Enquiry counters, and Admin Report kept showing stale
// numbers after edits made elsewhere.
const STATS_QUERY_KEYS: unknown[][] = [
  ["dashboard"],
  ["dashboard-todos"],
  ["upcoming-events"],
  ["enquiry-status-counts"],
  ["admin-report"],
  ["suppliers-report"],
  ["completed-events"],
  ["confirm-events-dropdown"],
  ["events-dropdown"],
  ["calendar"],
];

export function invalidateAllStats(queryClient: QueryClient) {
  STATS_QUERY_KEYS.forEach((queryKey) => {
    // refetchType: "all" — without it, invalidateQueries only refetches a
    // query that's currently mounted/observed. Whichever of these screens
    // isn't open right now (e.g. confirming a deposit from Open Enquiry
    // while the Dashboard tab isn't mounted) would be marked stale but never
    // actually re-fetched — and since this app's query defaults disable
    // refetch-on-mount, navigating back later just replayed the old cached
    // snapshot forever instead of showing the update.
    queryClient.invalidateQueries({ queryKey, refetchType: "all" });
  });
}
