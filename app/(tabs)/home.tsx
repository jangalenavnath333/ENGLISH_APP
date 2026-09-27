import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../lib/useAuth";
import { router } from "expo-router";
import * as Speech from "expo-speech";

export default function HomeScreen() {
  const { profile, logout } = useAuth();
  
  const xp = profile?.xp || 0;
  const streak = profile?.streak || 0;
  const name = profile?.name || "Learner";
  const level = profile?.level || "Elementary Level 1";

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm("तुम्हाला नक्की Logout करायचं आहे का? (Are you sure?)")) {
        await logout();
        router.replace("/");
      }
    } else {
      Alert.alert("Logout", "तुम्हाला नक्की Logout करायचं आहे का?", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Logout", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          }
        }
      ]);
    }
  };

  const playRecap = () => {
    Speech.speak("Here is a quick recap of your last session. You ordered food with your friends. You said: I would like a coffee.", { language: "en-US", rate: 0.9 });
  };

  const playWord = () => {
    Speech.speak("Appetite. Desire to eat.", { language: "en-US", rate: 0.8 });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
            style={styles.logoSmall} 
          />
          <View>
            <Text style={styles.headerTitle}>Bolu</Text>
            <Text style={styles.headerSubtitle}>Home</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#D97706" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Good morning, {name.split(" ")[0]}! 👋</Text>
          <Text style={styles.subGreeting}>
            आजची प्रॅक्टिस पूर्ण करूया! <Text style={styles.subGreetingEn}>(Let's complete today's ...)</Text>
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
            <View style={styles.statIconRow}>
              <Ionicons name="flame" size={16} color="#D97706" />
              <Text style={styles.statValue}>{streak} Days</Text>
            </View>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#E0F2FE' }]}>
            <View style={styles.statIconRow}>
              <MaterialCommunityIcons name="diamond" size={16} color="#0284C7" />
              <Text style={styles.statValue}>{xp} XP</Text>
            </View>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#E6F4EA' }]}>
            <View style={styles.statIconRow}>
              <Ionicons name="school" size={16} color="#145E4C" />
              <Text style={styles.statValue}>Elem.</Text>
            </View>
            <Text style={styles.statLabel}>{level}</Text>
          </View>
        </View>

        {/* Main Goal Card */}
        <View style={styles.goalCard}>
          <View style={styles.goalTag}>
            <View style={styles.greenDotLight} />
            <Text style={styles.goalTagText}>TODAY'S GOAL · 10 MIN</Text>
          </View>
          <Text style={styles.goalTitle}>Start Today's Practice</Text>
          <Text style={styles.goalLesson}>Lesson {profile?.currentLesson || 1} · Step-by-step English 🚀</Text>
          
          <Text style={styles.goalDescMarathi}>
            तुमच्या सध्याच्या पातळीनुसार आजचा नवीन धडा शिका आणि प्रॅक्टिस करा.
          </Text>
          <Text style={styles.goalDescEnglish}>
            (Learn and practice today's new lesson based on your current level)
          </Text>

          <View style={styles.goalFooter}>
            <TouchableOpacity style={styles.startBtn} onPress={() => router.navigate(`/(tabs)/learn?lesson=${profile?.currentLesson || 1}`)}>
              <Text style={styles.startBtnText}>Start Lesson {profile?.currentLesson || 1}</Text>
              <Ionicons name="arrow-forward" size={18} color="#145E4C" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Step 1</Text>
              <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
              </View>
            </View>
          </View>
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.tipTitleRow}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
                style={styles.tipIcon} 
              />
              <Text style={styles.tipTitle}>BOLU चा सल्ला (BOLU'S TIP) 💡</Text>
            </View>
            <Text style={styles.tipCategory}>Speaking</Text>
          </View>
          <Text style={styles.tipText}>
            Today's focus: ordering food! 🍽️ You struggled with <Text style={styles.tipHighlight}>"I would like..."</Text> last time — let's nail it today!
          </Text>
          <View style={styles.tipQuote}>
            <View style={styles.quoteBar} />
            <Text style={styles.quoteText}>
              "I want" पेक्षा "I would like" अधिक नम्र वाटते.
            </Text>
          </View>
        </View>

        {/* Previous Session Card */}
        <View style={styles.prevCard}>
          <View style={styles.prevHeader}>
            <Text style={styles.prevTitle}>PREVIOUS SESSION</Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>Score: 72/100</Text>
            </View>
          </View>
          <View style={styles.prevContent}>
            <Text style={styles.prevLesson}>📝 Lesson 5 · Friends & C...</Text>
          </View>
          <View style={styles.prevFooter}>
            <TouchableOpacity style={styles.audioRow} onPress={playRecap}>
              <Ionicons name="play-circle-outline" size={24} color="#3B82F6" />
              <Text style={styles.audioText}>Listen to recap (0:45)</Text>
            </TouchableOpacity>
            <View style={styles.completedRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#145E4C" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Bottom Small Cards Row */}
        <View style={styles.smallCardsRow}>
          {/* Daily Word */}
          <View style={[styles.smallCard, { backgroundColor: '#F0FDF4' }]}>
            <View style={styles.scHeader}>
              <Text style={styles.scTitle}>DAILY WORD</Text>
              <Ionicons name="language" size={16} color="#145E4C" />
            </View>
            <Text style={styles.scWord}>Appetite</Text>
            <Text style={styles.scMeaning}>भूक (Desire to eat)</Text>
            <TouchableOpacity style={styles.scAction} onPress={playWord}>
              <Text style={styles.scActionText}>Practice audio</Text>
              <Ionicons name="volume-high-outline" size={16} color="#145E4C" />
            </TouchableOpacity>
          </View>

          {/* Quick Mic */}
          <View style={[styles.smallCard, { backgroundColor: '#FFFBEB' }]}>
            <View style={styles.scHeader}>
              <Text style={styles.scTitle}>QUICK MIC</Text>
              <Ionicons name="mic-outline" size={16} color="#D97706" />
            </View>
            <Text style={styles.scWord}>Coffee or Tea?</Text>
            <Text style={styles.scMeaning}>2 वाक्यात उत्तर द्या</Text>
            <TouchableOpacity style={styles.scActionOrange} onPress={() => router.navigate("/(tabs)/assess")}>
              <Text style={styles.scActionTextOrange}>Start (60s)</Text>
              <Ionicons name="arrow-forward" size={16} color="#D97706" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.browseAllBtn} onPress={() => router.navigate("/(tabs)/progress")}>
          <Text style={styles.browseAllText}>🗺️ Browse All Lessons</Text>
          <Ionicons name="chevron-forward" size={16} color="#145E4C" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoSmall: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#145E4C',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D97706',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#145E4C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  subGreetingEn: {
    color: '#6B7280',
    fontWeight: 'normal',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  goalCard: {
    backgroundColor: '#145E4C',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
  },
  greenDotLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A7F3D0',
  },
  goalTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goalLesson: {
    color: '#A7F3D0',
    fontSize: 14,
    marginBottom: 16,
  },
  goalDescMarathi: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  goalDescEnglish: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 24,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  startBtnText: {
    color: '#145E4C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
  },
  progressBarBg: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressBarFill: {
    width: '33%',
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipIcon: {
    width: 24,
    height: 24,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#145E4C',
  },
  tipCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  tipHighlight: {
    fontWeight: 'bold',
    color: '#145E4C',
  },
  tipQuote: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  quoteBar: {
    width: 4,
    backgroundColor: '#D97706',
    borderRadius: 2,
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },
  prevCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#145E4C',
  },
  prevHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prevTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  prevContent: {
    marginBottom: 12,
  },
  prevLesson: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  prevFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioText: {
    fontSize: 13,
    color: '#4B5563',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#145E4C',
    fontWeight: '500',
  },
  smallCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  smallCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  scHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  scWord: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  scMeaning: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 16,
  },
  scAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scActionText: {
    fontSize: 12,
    color: '#145E4C',
    fontWeight: '500',
  },
  scActionOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scActionTextOrange: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  browseAllBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  browseAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#145E4C',
  }
});
