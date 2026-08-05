import { MANGA_CATEGORY_TITLES } from "@mangakai/shared";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BannerBar } from "@/components/banner-bar";
import { Hero } from "@/components/hero";
import { SectionRow } from "@/components/section-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useHomePage } from "@/hooks/use-home-page";
import { useTheme } from "@/hooks/use-theme";

export default function HomeScreen() {
  const { data, error, loading, refreshing, refresh } = useHomePage();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Checked before `!data`, or the very first frame flashes the error state.
  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.textSecondary} />
      </ThemedView>
    );
  }

  // Only a first load with nothing to show takes over the screen. A failed
  // refresh keeps the last good page and reports itself inline instead.
  if (!data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="smallBold">Could not load MangaKai</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.centeredText}
        >
          {error ?? "Something went wrong."}
        </ThemedText>

        <Pressable
          onPress={refresh}
          disabled={refreshing}
          style={[styles.retry, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">
            {refreshing ? "Retrying…" : "Try again"}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.textSecondary}
          />
        }
      >
        <BannerBar initialBanners={data.banners} />

        {error && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.staleNotice}
          >
            {error} Showing the last version.
          </ThemedText>
        )}

        {data.hero && <Hero manga={data.hero} />}

        <SectionRow
          title="Staff Picks"
          items={data.staffPicks.map((pick) => pick.manga)}
        />
        <SectionRow
          title={MANGA_CATEGORY_TITLES.popular}
          items={data.popular}
          category="popular"
        />
        <SectionRow
          title={MANGA_CATEGORY_TITLES.latest}
          items={data.latestUpdates}
          category="latest"
        />
        <SectionRow
          title={MANGA_CATEGORY_TITLES.recent}
          items={data.recentlyAdded}
          category="recent"
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  centeredText: {
    textAlign: "center",
  },
  retry: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  staleNotice: {
    paddingHorizontal: Spacing.three,
  },
});
