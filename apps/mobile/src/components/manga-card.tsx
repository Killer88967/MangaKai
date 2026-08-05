import type { MangaSummary } from "@mangakai/shared";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Two and a bit cards fit across a phone at this width, so the row visibly
 * runs off the edge and reads as scrollable without a scrollbar.
 */
export const CardWidth = 124;

/**
 * One manga in a row. Covers are 2:3, which is what MangaDex uploads.
 *
 * `Link` rather than a manual `router.push` so the href is typechecked against
 * the route tree and long-press previews work on iOS.
 *
 * The styling sits on an inner View, not on the Pressable. `Link asChild`
 * renders through Radix's Slot, which merges styles with `{...slot,
 * ...child}` — spreading a *function* style yields `{}`, so a
 * `style={({ pressed }) => ...}` on the direct child is silently thrown away.
 * Pressable's children-as-function gives the same effect without a style prop
 * for Slot to mangle.
 */
export function MangaCard({
  manga,
  width = CardWidth,
}: {
  manga: MangaSummary;
  /** Rows use the fixed width; the browse grid computes one from the screen. */
  width?: number;
}) {
  const theme = useTheme();

  return (
    <Link href={`/manga/${manga.id}`} asChild>
      <Pressable>
        {({ pressed }) => (
          <View
            style={[styles.container, { width }, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.cover,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              {manga.cover ? (
                <Image
                  // `medium` is the 512px render; `original` is far larger
                  // than a card needs and makes the row jerky on first scroll.
                  source={manga.cover.medium}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={150}
                  // Lets the list reuse views instead of refetching on recycle.
                  recyclingKey={manga.id}
                />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  No cover
                </ThemedText>
              )}
            </View>

            <ThemedText type="smallBold" numberOfLines={2}>
              {manga.title}
            </ThemedText>

            {manga.lastChapter && (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={1}
              >
                Ch. {manga.lastChapter}
              </ThemedText>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  cover: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
