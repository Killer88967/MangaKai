import type { MangaSummary } from "@mangakai/shared";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function Pill({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.pillText}
      >
        {label}
      </ThemedText>
    </View>
  );
}

/** The single manga the homepage leads with. */
export function Hero({ manga }: { manga: MangaSummary }) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundElement }]}
    >
      <View
        style={[styles.cover, { backgroundColor: theme.backgroundSelected }]}
      >
        {manga.cover && (
          <Image
            source={manga.cover.medium}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        )}
      </View>

      <View style={styles.details}>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.eyebrow}
        >
          FEATURED
        </ThemedText>

        <ThemedText style={styles.title} numberOfLines={3}>
          {manga.title}
        </ThemedText>

        {manga.description !== "" && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={4}>
            {manga.description}
          </ThemedText>
        )}

        <View style={styles.meta}>
          <Pill label={manga.status} />
          {manga.year !== null && <Pill label={String(manga.year)} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.three,
    padding: Spacing.three,
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  cover: {
    width: 104,
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
    overflow: "hidden",
  },
  details: {
    // Without this a long title stretches the row instead of wrapping.
    flex: 1,
    gap: Spacing.one,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.four,
  },
  pillText: {
    textTransform: "capitalize",
  },
});
