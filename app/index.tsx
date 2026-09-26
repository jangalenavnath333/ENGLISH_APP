import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen() {
  const handleLogin = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>
            <Text style={styles.titleDark}>Bolu </Text>
            <Text style={styles.titleGreen}>English</Text>
          </Text>
          <Text style={styles.subtitleMarathi}>इंग्रजी बोलायला शिका — तुमच्या भाषेत!</Text>
          <Text style={styles.subtitleEnglish}>
            Learn confident spoken English with gentle Marathi support
          </Text>
        </View>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🎯 AI Coach</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🗣️ Speak Practice</Text>
          </View>
        </View>
        <View style={styles.badgesRowSingle}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏆 Daily Streaks</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.cardsContainer}>
          {/* Verified Learners Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardSubtitle}>VERIFIED LEARNERS</Text>
            </View>
            <View style={styles.learnersRow}>
              <View style={styles.avatars}>
                <View style={[styles.avatar, { zIndex: 3, backgroundColor: '#FFD700' }]} />
                <View style={[styles.avatar, { zIndex: 2, marginLeft: -10, backgroundColor: '#FF6347' }]} />
                <View style={[styles.avatar, { zIndex: 1, marginLeft: -10, backgroundColor: '#4682B4' }]} />
              </View>
              <Text style={styles.learnersText}>
                Loved by <Text style={styles.boldGreenText}>45,000+</Text> Marathi college students across Pune, Mumbai & ...
              </Text>
            </View>
          </View>

          {/* Daily Marathi Prompt Card */}
          <View style={[styles.infoCard, styles.promptCard]}>
            <View style={styles.promptHeaderRow}>
              <View style={styles.promptLabel}>
                <View style={styles.greenDot} />
                <Text style={styles.cardSubtitleGreen}>DAILY MARATHI PROMPT</Text>
              </View>
              <Text style={styles.promptTime}>2 mins / day</Text>
            </View>
            <View style={styles.promptBox}>
              <View style={styles.promptIconContainer}>
                <Ionicons name="person-circle-outline" size={24} color="#D97706" />
              </View>
              <View style={styles.promptTextContainer}>
                <Text style={styles.promptMarathi}>"मला कॅम्पस इंटरव्ह्यूची तयारी करायची ..."</Text>
                <Text style={styles.promptEnglish}>"I want to prepare for campus interviews."</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Login Buttons */}
        <View style={styles.loginSection}>
          <TouchableOpacity style={styles.googleButton} onPress={handleLogin}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
              <Ionicons name="phone-portrait-outline" size={20} color="#145E4C" />
              <Text style={styles.secondaryButtonText}>Phone Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.secondaryButtonTextDark}>Guest Entry</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color="#145E4C" />
            <Text style={styles.footerText}>
              Free to start • No credit card needed • Zero ad interruptions
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  titleDark: {
    color: '#111827',
  },
  titleGreen: {
    color: '#145E4C',
  },
  subtitleMarathi: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#145E4C',
    marginBottom: 4,
  },
  subtitleEnglish: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  badgesRowSingle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  cardsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  promptCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  cardSubtitleGreen: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#145E4C',
    letterSpacing: 0.5,
  },
  learnersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  learnersText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  boldGreenText: {
    fontWeight: 'bold',
    color: '#145E4C',
  },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#145E4C',
  },
  promptTime: {
    fontSize: 10,
    color: '#6B7280',
  },
  promptBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  promptIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptTextContainer: {
    flex: 1,
  },
  promptMarathi: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  promptEnglish: {
    fontSize: 13,
    color: '#145E4C',
  },
  loginSection: {
    width: '100%',
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#145E4C',
  },
  secondaryButtonTextDark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
  }
});
