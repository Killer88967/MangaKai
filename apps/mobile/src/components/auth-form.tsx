import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const registering = mode === "register";
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      if (registering) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }

      // Replace, not push: the back gesture should not return to a sign-in
      // screen the user has already completed.
      router.replace("/");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Something went wrong.",
      );
      setPending(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + Spacing.five },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title">
            {registering ? "Create your account" : "Welcome back"}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {registering
              ? "Save what you are reading and pick it back up anywhere."
              : "Sign in to pick up where you left off."}
          </ThemedText>

          {registering && (
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              autoComplete="name"
              maxLength={50}
              style={inputStyle}
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.textSecondary}
            // Without these an iOS keyboard capitalises the first letter and
            // "Ernie@…" is a different string to the one the user meant.
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            style={inputStyle}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={registering ? "At least 8 characters" : "Password"}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={registering ? "new-password" : "current-password"}
            onSubmitEditing={submit}
            returnKeyType="go"
            style={inputStyle}
          />

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Pressable
            onPress={submit}
            disabled={pending}
            style={[
              styles.submit,
              { backgroundColor: theme.text },
              pending && styles.submitPending,
            ]}
          >
            {pending ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {registering ? "Create account" : "Sign in"}
              </ThemedText>
            )}
          </Pressable>

          <Link
            href={registering ? "/login" : "/register"}
            replace
            style={styles.switchLink}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {registering
                ? "Already have an account? Sign in"
                : "New to MangaKai? Create one"}
            </ThemedText>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  error: {
    color: "#F2555A",
  },
  submit: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: Spacing.three,
  },
  submitPending: {
    opacity: 0.6,
  },
  switchLink: {
    alignSelf: "center",
    paddingVertical: Spacing.two,
  },
});
