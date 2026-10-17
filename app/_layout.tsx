import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import GestureRoot from "../lib/GestureRoot";
import { AuthProvider, useAuth } from "../lib/useAuth";
import { setupDailyReminder } from "../lib/notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Ask for notification permission once, after login, on phones only (never on web page load)
  useEffect(() => {
    if (user && Platform.OS !== "web") setupDailyReminder();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && inTabsGroup) {
      // Redirect to the login page.
      router.replace("/");
    } else if (user && !inTabsGroup) {
      // Redirect away from the login page.
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureRoot>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureRoot>
  );
}
