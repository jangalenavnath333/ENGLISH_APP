import { View } from "react-native";

// Web: no gesture handler needed. Keeping it out of the web bundle makes the app load faster.
export default function GestureRoot({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
