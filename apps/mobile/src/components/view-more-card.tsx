import type { MangaCategory } from "@mangakai/shared";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { CardWidth } from "@/components/manga-card";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Sits at the end of a row and opens the full listing for that category.
 *
 * Deliberately the same footprint as a `MangaCard` so the row keeps a steady
 * rhythm and the card reads as part of the shelf rather than a button bolted on.
 */
export function ViewMoreCard({ category }: { category: MangaCategory }) {
  const theme = useTheme();

  return (
    <Link href={`/browse/${category}`} asChild>
      {/* Styles go on an inner View — see the note in `manga-card.tsx`. */}
      <Pressable>
        {({ pressed }) => (
          <View style={[styles.container, pressed && styles.pressed]}>
            <View
              style={[
                styles.tile,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <ThemedText style={styles.arrow} themeColor="textSecondary">
                →
              </ThemedText>
            </View>

            <ThemedText type="smallBold" numberOfLines={2}>
              View more
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CardWidth,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  tile: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 28,
    lineHeight: 34,
  },
});
