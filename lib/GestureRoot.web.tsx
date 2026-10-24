import { View, StyleSheet } from "react-native";

// Web: centers the app shell on desktop and laptop screens (up to 520px) while maintaining 100% width on mobile
export default function GestureRoot({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.appShell}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#0B1120",
    alignItems: "center",
    justifyContent: "center",
  },
  appShell: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    height: "100%",
    backgroundColor: "#F8FAFC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
    overflow: "hidden",
  },
});

