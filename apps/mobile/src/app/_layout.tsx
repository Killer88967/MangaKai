import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

/**
 * App-wide shell: theme and splash only.
 *
 * The navigator here is a stack rather than the tabs, so screens pushed on top
 * of `(tabs)` — manga detail, and later auth — cover the tab bar instead of
 * being trapped inside it.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/* The tab group draws its own chrome, so it must not get a header. */}
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
