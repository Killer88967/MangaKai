import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

/**
 * Signed-in state at the top of the homepage: who you are and a way out, or a
 * way in. Renders nothing until the stored token has been checked, so it never
 * flashes "Sign in" at someone who is already signed in.
 */
export function AccountBar() {
  const { user, loading, signOut } = useAuth();
  const theme = useTheme();

  if (loading) return <View style={styles.placeholder} />;

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {user.displayName}
          </ThemedText>
          <Pressable
            onPress={signOut}
            hitSlop={Spacing.two}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ThemedText type="smallBold">Sign out</ThemedText>
          </Pressable>
        </>
      ) : (
        <>
          <Link href="/login" style={styles.link}>
            <ThemedText type="small" themeColor="textSecondary">
              Sign in
            </ThemedText>
          </Link>
          <Link href="/register" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="smallBold">Create account</ThemedText>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  // Holds the row's height while the session is being checked, so the content
  // below does not jump once it resolves.
  placeholder: {
    height: 32,
  },
  link: {
    paddingVertical: Spacing.one,
  },
  cta: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
