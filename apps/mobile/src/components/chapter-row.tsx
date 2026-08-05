import type { Chapter } from "@mangakai/shared";
import { Link } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** "Ch. 12 — Title", falling back sensibly when either part is missing. */
function chapterLabel(chapter: Chapter): string {
  const number = chapter.number ? `Ch. ${chapter.number}` : "Oneshot";

  return chapter.title ? `${number} — ${chapter.title}` : number;
}

function Body({ chapter, pressed }: { chapter: Chapter; pressed: boolean }) {
  const theme = useTheme();

  const meta = [
    chapter.scanlationGroup,
    chapter.readable ? `${chapter.pages} pages` : "Read on publisher's site",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {chapterLabel(chapter)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {meta}
        </ThemedText>
      </View>

      <ThemedText themeColor="textSecondary">
        {chapter.readable ? "›" : "↗"}
      </ThemedText>
    </View>
  );
}

/**
 * A chapter in the list.
 *
 * Chapters MangaDex does not host open in the browser instead of the reader —
 * the API already decided which is which via `readable`, so this only picks
 * the destination.
 *
 * Styles live on an inner View because `Link asChild` erases a function style;
 * see the note in `manga-card.tsx`.
 */
export function ChapterRow({ chapter }: { chapter: Chapter }) {
  if (!chapter.readable) {
    return (
      <Pressable
        onPress={() => {
          if (chapter.externalUrl) void Linking.openURL(chapter.externalUrl);
        }}
        disabled={!chapter.externalUrl}
      >
        {({ pressed }) => <Body chapter={chapter} pressed={pressed} />}
      </Pressable>
    );
  }

  return (
    <Link
      href={{
        pathname: "/read/[chapterId]",
        params: { chapterId: chapter.id, title: chapterLabel(chapter) },
      }}
      asChild
    >
      <Pressable>
        {({ pressed }) => <Body chapter={chapter} pressed={pressed} />}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
