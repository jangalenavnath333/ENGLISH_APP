import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";

export default function PracticeScreen() {
  const [modalVisible, setModalVisible] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Fake Background - Live Conversation Session */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
            style={styles.logoSmall} 
          />
          <Text style={styles.headerTitle}>Live Conversation Sess...</Text>
        </View>
        <View style={styles.profileIcon}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={!modalVisible}>
        {/* Mock background content to match image 2 faint background */}
        <View style={styles.mockCard}>
          <View style={styles.mockHeaderRow}>
            <View style={styles.mockIconBox} />
            <View style={styles.mockTextLines}>
              <View style={styles.mockLine} />
              <View style={styles.mockLine2} />
            </View>
          </View>
          <View style={styles.mockDivider} />
          <View style={styles.mockChatBubble1}>
            <View style={styles.mockLine} />
            <View style={styles.mockLine2} />
          </View>
          <View style={styles.mockChatBubble2}>
            <View style={styles.mockLine} />
            <View style={styles.mockLine3} />
          </View>
        </View>

        <View style={styles.mockMicSection}>
          <View style={styles.mockMicBtn}>
            <Ionicons name="mic" size={32} color="#fff" />
          </View>
        </View>
      </ScrollView>

      {/* Overlay Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <Text style={styles.sparkleLeft}>✨</Text>
            <Text style={styles.sparkleRight}>🎉</Text>
            <Text style={styles.starRight}>⭐</Text>

            <View style={styles.modalLogoContainer}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
                style={styles.modalLogo} 
              />
            </View>
            
            <Text style={styles.modalTitle}>Great Job, Navnath!</Text>
            <Text style={styles.modalSubtitle}>You completed today's practice!</Text>
            <Text style={styles.modalSubtitleMarathi}>आजची प्रॅक्टिस पूर्ण झाली! उत्तम सुरुवात केलीस.</Text>

            <View style={styles.xpBadgeModal}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.xpBadgeTextModal}>+50 XP Earned</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>Daily Streak</Text>
                <Text style={styles.statValue}>🔥 4 Days</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>Accuracy</Text>
                <Text style={styles.statValue}>🎯 94%</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.continueBtn} 
              onPress={() => {
                setModalVisible(false);
                router.replace('/(tabs)/home');
              }}
            >
              <Text style={styles.continueBtnText}>🎉 Continue to Home</Text>
              <Ionicons name="home-outline" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.reviewBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.reviewBtnText}>Review Practice Questions</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoSmall: {
    width: 28,
    height: 28,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
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
    opacity: 0.3,
  },
  mockCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mockHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mockIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  mockTextLines: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  mockLine: {
    width: '100%',
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  mockLine2: {
    width: '70%',
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  mockLine3: {
    width: '40%',
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  mockDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  mockChatBubble1: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginBottom: 16,
    gap: 8,
    width: '80%',
  },
  mockChatBubble2: {
    backgroundColor: '#E6F4EA',
    padding: 16,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    width: '80%',
    gap: 8,
  },
  mockMicSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  mockMicBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#145E4C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sparkleLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 24,
  },
  sparkleRight: {
    position: 'absolute',
    top: 30,
    right: 20,
    fontSize: 24,
  },
  starRight: {
    position: 'absolute',
    top: '45%',
    right: 15,
    fontSize: 20,
  },
  modalLogoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalLogo: {
    width: 50,
    height: 50,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#145E4C',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  modalSubtitleMarathi: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  xpBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  xpBadgeTextModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  continueBtn: {
    backgroundColor: '#145E4C',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  reviewBtn: {
    paddingVertical: 8,
  },
  reviewBtnText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  }
});
