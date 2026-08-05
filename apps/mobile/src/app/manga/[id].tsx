import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ChapterRow } from "@/components/chapter-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useChapters } from "@/hooks/use-chapters";
import { useManga } from "@/hooks/use-manga";
import { useTheme } from "@/hooks/use-theme";

function Chip({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Credits({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;

  return (
    <ThemedText type="small" themeColor="textSecondary">
      {label}: {names.join(", ")}
    </ThemedText>
  );
}

export default function MangaScreen() {
  // A malformed deep link can omit the param, so do not assume it is a string.
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, retry } = useManga(id);
  const {
    chapters,
    total: chaptersTotal,
    error: chaptersError,
    loading: chaptersLoading,
    loadMore,
  } = useChapters(id);
  const theme = useTheme();

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: true, title: "" }} />
        <ActivityIndicator color={theme.textSecondary} />
      </ThemedView>
    );
  }

  if (!data) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: true, title: "" }} />
        <ThemedText type="smallBold">Could not load this manga</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.centeredText}
        >
          {error ?? "Something went wrong."}
        </ThemedText>

        <Pressable
          onPress={retry}
          style={[styles.retry, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Title comes from the payload, so it is only known after loading. */}
      <Stack.Screen options={{ headerShown: true, title: data.title }} />

      {/*
        A FlatList, not a ScrollView: long series run to hundreds of chapters,
        so the details become a header above a virtualised list.
      */}
      <FlatList
        data={chapters}
        keyExtractor={(chapter) => chapter.id}
        renderItem={({ item }) => <ChapterRow chapter={item} />}
        contentContainerStyle={styles.content}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.header}>
              <View
                style={[
                  styles.cover,
                  { backgroundColor: theme.backgroundElement },
                ]}
              >
                {data.cover && (
                  <Image
                    source={data.cover.medium}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={150}
                  />
                )}
              </View>

              <View style={styles.headerText}>
                <ThemedText style={styles.title}>{data.title}</ThemedText>

                <View style={styles.chips}>
                  <Chip label={data.status} />
                  {data.year !== null && <Chip label={String(data.year)} />}
                  {data.lastChapter && (
                    <Chip label={`Ch. ${data.lastChapter}`} />
                  )}
                </View>

                <Credits label="Story" names={data.authors} />
                <Credits label="Art" names={data.artists} />
              </View>
            </View>

            {data.description !== "" && (
              <ThemedText type="small">{data.description}</ThemedText>
            )}

            {data.tags.length > 0 && (
              <View style={styles.chips}>
                {data.tags.map((tag) => (
                  <Chip key={tag.id} label={tag.name} />
                ))}
              </View>
            )}

            <ThemedText style={styles.chaptersHeading}>
              {chaptersLoading
                ? "Chapters"
                : `Chapters (${chaptersTotal.toLocaleString()})`}
            </ThemedText>

            {chaptersError && (
              <ThemedText type="small" themeColor="textSecondary">
                {chaptersError}
              </ThemedText>
            )}
          </View>
        }
        ListEmptyComponent={
          chaptersLoading ? (
            <ActivityIndicator color={theme.textSecondary} />
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No English chapters yet.
            </ThemedText>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerBlock: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  chaptersHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  cover: {
    width: 120,
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
    overflow: "hidden",
  },
  headerText: {
    flex: 1,
    gap: Spacing.two,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.four,
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
});
