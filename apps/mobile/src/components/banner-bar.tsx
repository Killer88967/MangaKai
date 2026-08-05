import type { Banner, BannerVariant } from "@mangakai/shared";
import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useLiveBanners } from "@/hooks/use-live-banners";

/**
 * The shared theme has no accent palette, so the variant colours live here
 * rather than being bolted onto `Colors`. These mirror the web banner bar.
 */
const variantColors: Record<
  BannerVariant,
  { background: string; border: string; accent: string }
> = {
  info: {
    background: "rgba(14, 165, 233, 0.15)",
    border: "rgba(56, 189, 248, 0.35)",
    accent: "#7dd3fc",
  },
  announcement: {
    background: "rgba(139, 92, 246, 0.15)",
    border: "rgba(167, 139, 250, 0.35)",
    accent: "#c4b5fd",
  },
  warning: {
    background: "rgba(245, 158, 11, 0.15)",
    border: "rgba(251, 191, 36, 0.35)",
    accent: "#fcd34d",
  },
};

const variantLabels: Record<BannerVariant, string> = {
  info: "Notice",
  announcement: "Announcement",
  warning: "Heads up",
};

function BannerRow({ banner }: { banner: Banner }) {
  const colors = variantColors[banner.variant];

  const body = (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      {banner.imageUrl && (
        <Image
          source={banner.imageUrl}
          style={styles.image}
          contentFit="cover"
        />
      )}

      <View style={styles.text}>
        <ThemedText
          type="small"
          style={[styles.label, { color: colors.accent }]}
        >
          {variantLabels[banner.variant].toUpperCase()}
        </ThemedText>

        <ThemedText type="smallBold">{banner.title}</ThemedText>

        {banner.body && (
          <ThemedText type="small" themeColor="textSecondary">
            {banner.body}
          </ThemedText>
        )}
      </View>
    </View>
  );

  if (!banner.linkUrl) return body;

  // Admin-supplied URL, so it goes to the system browser rather than a route.
  return (
    <Pressable
      onPress={() => {
        void Linking.openURL(banner.linkUrl as string);
      }}
    >
      {body}
    </Pressable>
  );
}

/**
 * Site-wide notices, published from `pnpm banner new`.
 *
 * Subscribes to the stream itself rather than taking a fixed list, so a banner
 * published from a terminal appears without the user pulling to refresh.
 */
export function BannerBar({ initialBanners }: { initialBanners: Banner[] }) {
  const banners = useLiveBanners(initialBanners);

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      {banners.map((banner) => (
        <BannerRow key={banner.id} banner={banner} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    width: 36,
    height: 36,
    borderRadius: Spacing.one,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
});
