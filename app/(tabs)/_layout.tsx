import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#145E4C",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#F3F4F6",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="auto-fix" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="talk"
        options={{
          title: "Talk",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "mic" : "mic-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assist"
        options={{
          title: "Assist",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bulb" : "bulb-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assess"
        options={{
          title: "Assess",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "checkbox" : "checkbox-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
