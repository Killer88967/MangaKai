import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getChapterPages } from "@/lib/api";

/**
 * Manga pages are usually taller than they are wide, so a page occupies
 * roughly this much height before its real size is known. Getting the guess
 * close keeps the scrollbar from lurching as pages resolve.
 */
const ASSUMED_RATIO = 2 / 3;

/**
 * One page.
 *
 * Holds its own aspect ratio rather than lifting it to the screen: a chapter
 * can run to 90+ pages, and a shared map would re-render every one of them
 * each time a single image finished loading.
 */
function ReaderPage({
  uri,
  width,
  onError,
}: {
  uri: string;
  width: number;
  onError: () => void;
}) {
  const [ratio, setRatio] = useState(ASSUMED_RATIO);

  return (
    <Image
      source={uri}
      style={{ width, aspectRatio: ratio }}
      contentFit="contain"
      // Pages vary in size, so the real ratio only arrives with the image.
      onLoad={({ source }) => {
        if (source.width > 0 && source.height > 0) {
          setRatio(source.width / source.height);
        }
      }}
      onError={onError}
    />
  );
}

export default function ReaderScreen() {
  const { chapterId, title } = useLocalSearchParams<{
    chapterId: string;
    title?: string;
  }>();
  const { width } = useWindowDimensions();
  const theme = useTheme();

  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // One re-resolve per expiry, however many pages fail at once.
  const resolving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    getChapterPages(chapterId, controller.signal)
      .then((chapter) => setPages(chapter.pages))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load this chapter.",
        );
      })
      .finally(() => {
        resolving.current = false;
      });

    return () => controller.abort();
  }, [chapterId, attempt]);

  /**
   * MangaDex guarantees a page host for roughly 15 minutes, then starts
   * answering 403. Read a long chapter slowly and the back half dies, so a
   * failed image means "ask for a fresh host", not "this chapter is broken".
   */
  const handlePageError = useCallback(() => {
    if (resolving.current) return;

    resolving.current = true;
    setAttempt((value) => value + 1);
  }, []);

  const header = (
    <Stack.Screen options={{ headerShown: true, title: title ?? "Reading" }} />
  );

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        {header}
        <ThemedText type="smallBold">Could not open this chapter</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.centeredText}
        >
          {error}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!pages) {
    return (
      <ThemedView style={styles.centered}>
        {header}
        <ActivityIndicator color={theme.textSecondary} />
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <FlatList
        data={pages}
        // Keyed by position, not URL: re-resolving swaps every URL, and keying
        // on those would remount all pages and lose the reader's place.
        keyExtractor={(_uri, index) => String(index)}
        renderItem={({ item }) => (
          <ReaderPage uri={item} width={width} onError={handlePageError} />
        )}
        // Pages are large; keeping a couple either side is enough and stops
        // a long chapter from holding every decoded image in memory.
        windowSize={3}
        initialNumToRender={2}
        ListFooterComponent={
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.end}
          >
            End of chapter
          </ThemedText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Black, not the theme background: it is the standard reader backdrop and
    // stops letterboxing on odd-sized pages from looking like a rendering bug.
    backgroundColor: "#000000",
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
  end: {
    textAlign: "center",
    paddingVertical: Spacing.five,
  },
});
