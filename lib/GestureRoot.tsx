import { GestureHandlerRootView } from "react-native-gesture-handler";

// Native: gesture handler root (needed by navigation gestures)
export default function GestureRoot({ children }: { children: React.ReactNode }) {
  return <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>;
}
