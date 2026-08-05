import type { MangaCategory, MangaSummary } from "@mangakai/shared";
import { FlatList, StyleSheet, View } from "react-native";

import { MangaCard } from "@/components/manga-card";
import { ThemedText } from "@/components/themed-text";
import { ViewMoreCard } from "@/components/view-more-card";
import { Spacing } from "@/constants/theme";

interface SectionRowProps {
  title: string;
  items: MangaSummary[];
  /**
   * Omitted for rows that have no listing behind them — Staff Picks is a
   * hand-curated set, not a page of a larger query, so it gets no "View more".
   */
  category?: MangaCategory;
}

/**
 * A titled, horizontally scrolling shelf. Every homepage row is one of these.
 *
 * The list is horizontal and the screen scrolls vertically, so nesting it in a
 * ScrollView is fine — it is same-axis nesting that breaks virtualisation.
 */
export function SectionRow({ title, items, category }: SectionRowProps) {
  // A row the API returned nothing for should take up no space at all.
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={styles.heading}>{title}</ThemedText>

      <FlatList
        horizontal
        data={items}
        keyExtractor={(manga) => manga.id}
        renderItem={({ item }) => <MangaCard manga={item} />}
        showsHorizontalScrollIndicator={false}
        // Padding lives on the content, not the list, so cards can scroll to
        // the screen edge while the first one still lines up with the heading.
        contentContainerStyle={styles.list}
        // A footer rather than an extra data entry, so the list stays typed as
        // MangaSummary[] and keyExtractor never sees a sentinel value.
        ListFooterComponent={
          category ? <ViewMoreCard category={category} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    paddingHorizontal: Spacing.three,
  },
  list: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
