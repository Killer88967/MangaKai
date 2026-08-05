import AppTabs from "@/components/app-tabs";

/**
 * The tab bar only wraps routes inside this group. Anything outside it — a
 * login screen, a full-screen reader — renders without tabs.
 *
 * The group name is in parentheses, so it is stripped from the path: this
 * folder's `index.tsx` is still `/`, not `/(tabs)`.
 */
export default function TabsLayout() {
  return <AppTabs />;
}
