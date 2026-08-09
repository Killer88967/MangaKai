import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/hooks/use-auth";

SplashScreen.preventAutoHideAsync();

/**
 * App-wide shell: theme, splash and the session.
 *
 * The navigator here is a stack rather than the tabs, so screens pushed on top
 * of `(tabs)` — manga detail, the reader, sign-in — cover the tab bar instead
 * of being trapped inside it.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        {/* The tab group draws its own chrome, so it must not get a header. */}
        <Stack
          screenOptions={{
            headerShown: false,
            /**
             * Chevron only, no label. iOS labels the back button with the
             * previous screen's title, and a route group has none — so it fell
             * back to the folder name and read "< (tabs)".
             */
            headerBackButtonDisplayMode: "minimal",
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
