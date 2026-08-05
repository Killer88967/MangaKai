import {
  MANGA_CATEGORIES,
  MANGA_CATEGORY_TITLES,
  type MangaCategory,
} from "@mangakai/shared";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { MangaCard } from "@/components/manga-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useBrowse } from "@/hooks/use-browse";
import { useTheme } from "@/hooks/use-theme";

const COLUMNS = 3;

function isCategory(value: string | undefined): value is MangaCategory {
  return MANGA_CATEGORIES.includes(value as MangaCategory);
}

export default function BrowseScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { width } = useWindowDimensions();
  const theme = useTheme();

  // A hand-typed or stale deep link can name a category that does not exist.
  if (!isCategory(category)) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: true, title: "Not found" }} />
        <ThemedText type="smallBold">Unknown category</ThemedText>
      </ThemedView>
    );
  }

  return (
    <BrowseList
      category={category}
      width={width}
      textColor={theme.textSecondary}
    />
  );
}

/**
 * Split out because the guard above returns early, and hooks cannot live
 * behind a conditional return.
 */
function BrowseList({
  category,
  width,
  textColor,
}: {
  category: MangaCategory;
  width: number;
  textColor: string;
}) {
  const { items, total, error, loading, loadingMore, loadMore } =
    useBrowse(category);

  // Cards share the row's leftover space rather than a fixed width, so three
  // always fit regardless of screen size.
  const gutters = Spacing.three * 2;
  const gaps = Spacing.two * (COLUMNS - 1);
  const cardWidth = Math.floor((width - gutters - gaps) / COLUMNS);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: MANGA_CATEGORY_TITLES[category] }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={textColor} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(manga) => manga.id}
          numColumns={COLUMNS}
          renderItem={({ item }) => (
            <MangaCard manga={item} width={cardWidth} />
          )}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          // Start fetching a screen early so the spinner rarely appears.
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            error ? (
              <ThemedText type="small" themeColor="textSecondary">
                {error}
              </ThemedText>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={textColor} style={styles.footer} />
            ) : items.length >= total && total > 0 ? (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.footerText}
              >
                That is all {total.toLocaleString()} of them.
              </ThemedText>
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  column: {
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  footer: {
    marginTop: Spacing.three,
  },
  footerText: {
    marginTop: Spacing.three,
    textAlign: "center",
  },
});
