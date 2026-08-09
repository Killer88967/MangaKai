import { Stack } from "expo-router";

/**
 * Sign-in and register. Outside `(tabs)`, so these cover the tab bar rather
 * than rendering inside it, and the group name is stripped from the path —
 * the routes are `/login` and `/register`.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
