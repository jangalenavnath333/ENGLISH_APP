import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState<'Achievements' | 'Writing' | 'Speaking'>('Achievements');

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
            <Text style={styles.headerSubtitle}>Progress</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#D97706" />
            <Text style={styles.streakText}>5</Text>
          </View>
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.pageTitle}>My Progress (माझी प्रगती)</Text>
            <Text style={styles.pageSubtitle}>Navnath Waghmare · TY B.Sc. Comp</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Achievements' && styles.activeTab]}
            onPress={() => setActiveTab('Achievements')}
          >
            <Text style={activeTab === 'Achievements' ? styles.activeTabText : styles.tabText}>Achievements</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Writing' && styles.activeTab]}
            onPress={() => setActiveTab('Writing')}
          >
            <Text style={activeTab === 'Writing' ? styles.activeTabText : styles.tabText}>Writing (Mistakes)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Speaking' && styles.activeTab]}
            onPress={() => setActiveTab('Speaking')}
          >
            <Text style={activeTab === 'Speaking' ? styles.activeTabText : styles.tabText}>Speaking</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Achievements' && (
          <View>

        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Ionicons name="book-outline" size={14} color="#145E4C" />
              <Text style={styles.levelBadgeText}>Elementary Level 1 (प्राथमिक स्तर)</Text>
            </View>
            <View style={styles.levelRight}>
              <Ionicons name="flash" size={14} color="#D97706" />
              <Text style={styles.levelText}>Level 3</Text>
            </View>
          </View>
          <View style={styles.xpRow}>
            <Text style={styles.xpBig}>230</Text>
            <Text style={styles.xpTotal}> / 600 XP</Text>
            <View style={styles.spacer} />
            <Text style={styles.percentText}>38% Completed</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <View style={styles.levelFooter}>
            <Ionicons name="medal-outline" size={14} color="#D97706" />
            <Text style={styles.levelFooterText}>
              370 XP needed for <Text style={styles.boldText}>College Fluency Badge</Text>
            </Text>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges & Honors (पदके)</Text>
          <Text style={styles.sectionMeta}>3 of 6 Unlocked</Text>
        </View>
        
        <View style={styles.badgesGrid}>
          <View style={[styles.badgeBox, { backgroundColor: '#FFF7ED' }]}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="star" size={24} color="#D97706" />
            </View>
            <Text style={styles.badgeName}>First Steps</Text>
            <Text style={[styles.badgeStatus, { color: '#D97706' }]}>Earned</Text>
          </View>
          
          <View style={[styles.badgeBox, { backgroundColor: '#FEF2F2' }]}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="flame" size={24} color="#DC2626" />
            </View>
            <Text style={styles.badgeName}>5-Day Streak</Text>
            <Text style={[styles.badgeStatus, { color: '#DC2626' }]}>Active</Text>
          </View>
          
          <View style={[styles.badgeBox, { backgroundColor: '#ECFDF5' }]}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="power" size={24} color="#059669" />
            </View>
            <Text style={styles.badgeName}>Quick Learner</Text>
            <Text style={[styles.badgeStatus, { color: '#059669' }]}>Earned</Text>
          </View>
          
          <View style={styles.badgeBox}>
            <View style={styles.badgeIconBg}>
              <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.badgeNameLocked}>7-Day Streak</Text>
            <Text style={styles.badgeStatusLocked}>2 days left</Text>
          </View>
          
          <View style={styles.badgeBox}>
            <View style={styles.badgeIconBg}>
              <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.badgeNameLocked}>First Solo</Text>
            <Text style={styles.badgeStatusLocked}>Lesson 6</Text>
          </View>
          
          <View style={styles.badgeBox}>
            <View style={styles.badgeIconBg}>
              <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.badgeNameLocked}>All Lessons</Text>
            <Text style={styles.badgeStatusLocked}>0/8 Finished</Text>
          </View>
        </View>

        {/* Streak Activity Card */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.activityTitleRow}>
              <Ionicons name="flame" size={16} color="#D97706" />
              <Text style={styles.activityTitle}>5 Day Streak · Mon to Sun</Text>
            </View>
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>Best: 5</Text>
            </View>
          </View>
          
          <View style={styles.daysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <Text key={i} style={styles.dayText}>{day}</Text>
            ))}
          </View>
          
          {/* Activity Grid Mockup */}
          <View style={styles.gridRow}>
            {[1,1,1,1,0,1,1].map((v, i) => <View key={i} style={[styles.gridCell, v ? styles.cellGreen : styles.cellEmpty]} />)}
          </View>
          <View style={styles.gridRow}>
            {[1,1,1,1,1,1,0].map((v, i) => <View key={i} style={[styles.gridCell, v ? styles.cellGreen : styles.cellEmpty]} />)}
          </View>
          <View style={styles.gridRow}>
            {[1,1,1,0,1,1,1].map((v, i) => <View key={i} style={[styles.gridCell, v ? styles.cellGreen : styles.cellEmpty]} />)}
          </View>
          <View style={styles.gridRow}>
            {[1,1,1,1,2,0,0].map((v, i) => (
              <View key={i} style={[styles.gridCell, v === 1 ? styles.cellGreen : v === 2 ? styles.cellOrange : styles.cellEmpty]}>
                {v === 2 && <Ionicons name="flame" size={12} color="#fff" />}
              </View>
            ))}
          </View>

          <View style={styles.activityFooter}>
            <Text style={styles.activityFooterText}>Less practice</Text>
            <View style={styles.legendDots}>
              <View style={[styles.legendDot, {backgroundColor: '#E0F2FE'}]} />
              <View style={[styles.legendDot, {backgroundColor: '#6EE7B7'}]} />
              <View style={[styles.legendDot, {backgroundColor: '#145E4C'}]} />
              <View style={[styles.legendDot, {backgroundColor: '#D97706'}]} />
            </View>
            <Text style={styles.activityFooterText}>Goal reached 🔥</Text>
          </View>
        </View>

        {/* Upcoming Milestone */}
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneContent}>
            <Text style={styles.milestoneSubtitle}>UPCOMING MILESTONE</Text>
            <Text style={styles.milestoneTitle}>Canteen English Challenge</Text>
            <Text style={styles.milestoneDesc}>Practice tea and snack ordering phrases in Marathi & English</Text>
          </View>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play" size={24} color="#145E4C" />
          </TouchableOpacity>
        </View>

        {/* Lesson Path */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Lesson Path (धड्यांचा मार्ग)</Text>
            <Text style={styles.sectionDesc}>Step-by-step collegiate confidence</Text>
          </View>
          <View style={styles.doneBadge}>
            <Text style={styles.doneText}>5 / 8 Done</Text>
          </View>
        </View>

        <View style={styles.timeline}>
          {/* Timeline Line */}
          <View style={styles.timelineLine} />
          
          <TimelineItem num={1} title="Introduce Yourself" subtitle="स्वतःची ओळख करून देणे · 100%" done />
          <TimelineItem num={2} title="Everyday Objects" subtitle="दैनंदिन वस्तूंची नावे · 100%" done />
          <TimelineItem num={3} title="Expressing Needs" subtitle="गरजा व्यक्त करणे · 100%" done />
          <TimelineItem num={4} title="Preferences & Tastes" subtitle="पसंती आणि निवडी · 100%" done />
          <TimelineItem num={5} title="Friends & College" subtitle="मित्र आणि कॉलेज गप्पा · 100%" done />
          
          {/* Active Item */}
          <TouchableOpacity 
            style={[styles.timelineItem, styles.activeTimelineItem]}
            onPress={() => router.push('/(tabs)/practice?lesson=6')}
          >
            <View style={styles.activeNode}>
              <Text style={styles.activeNodeText}>6</Text>
            </View>
            <View style={styles.activeContent}>
              <View>
                <Text style={styles.activeTimelineTitle}>6. Canteen Conversation ☕</Text>
                <Text style={styles.activeTimelineSubtitle}>कॅन्टीनमधील संवाद · 15 Mins Practice</Text>
              </View>
              <View style={styles.nextUpRow}>
                <View style={styles.nextUpBadge}>
                  <Text style={styles.nextUpText}>Next Up!</Text>
                </View>
                <View style={styles.micIcon}>
                  <Ionicons name="mic" size={16} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          
          <TimelineItem num={7} title="Daily Routine" subtitle="दैनंदिन दिनक्रम" locked />
          <TimelineItem num={8} title="Weekend Plans" subtitle="सुट्टीचे नियोजन व तयारी" locked />
        </View>
        </View>
        )}

        {activeTab === 'Writing' && (
          <View style={{ flex: 1, paddingVertical: 40, alignItems: 'center' }}>
            <Ionicons name="book" size={64} color="#D1D5DB" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4B5563', marginTop: 16 }}>Your Mistake Book</Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>This feature is coming soon.</Text>
          </View>
        )}

        {activeTab === 'Speaking' && (
          <View style={{ flex: 1, paddingVertical: 40, alignItems: 'center' }}>
            <Ionicons name="mic" size={64} color="#D1D5DB" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4B5563', marginTop: 16 }}>Speaking Analysis</Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>This feature is coming soon.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineItem({ num, title, subtitle, done, locked }: any) {
  return (
    <TouchableOpacity 
      style={styles.timelineItem} 
      disabled={locked}
      onPress={() => router.push(`/(tabs)/practice?lesson=${num}`)}
    >
      <View style={[styles.node, done ? styles.nodeDone : styles.nodeLocked]}>
        {done && <Ionicons name="checkmark" size={16} color="#fff" />}
        {locked && <Ionicons name="lock-closed" size={14} color="#9CA3AF" />}
      </View>
      <View style={styles.timelineContent}>
        <View style={styles.timelineTextContainer}>
          <Text style={[styles.timelineTitle, locked && styles.textLocked]}>{num}. {title}</Text>
          <Text style={[styles.timelineSubtitle, locked && styles.textLocked]}>{subtitle}</Text>
        </View>
        {done && <Ionicons name="checkmark-circle-outline" size={20} color="#145E4C" style={styles.timelineCheck} />}
        {locked && <Ionicons name="lock-closed-outline" size={18} color="#D1D5DB" style={styles.timelineCheck} />}
      </View>
    </TouchableOpacity>
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
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#145E4C',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#145E4C',
  },
  levelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D97706',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  xpBig: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  xpTotal: {
    fontSize: 14,
    color: '#6B7280',
  },
  spacer: {
    flex: 1,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBarFill: {
    width: '38%',
    height: '100%',
    backgroundColor: '#145E4C',
    borderRadius: 4,
  },
  levelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelFooterText: {
    fontSize: 12,
    color: '#6B7280',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#374151',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  badgeBox: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeNameLocked: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeStatusLocked: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  bestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 10,
    color: '#6B7280',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gridCell: {
    width: 36,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellEmpty: {
    backgroundColor: '#F1F5F9',
  },
  cellGreen: {
    backgroundColor: '#145E4C',
  },
  cellOrange: {
    backgroundColor: '#D97706',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  activityFooterText: {
    fontSize: 10,
    color: '#6B7280',
  },
  legendDots: {
    flexDirection: 'row',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  milestoneCard: {
    backgroundColor: '#145E4C',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  milestoneContent: {
    flex: 1,
    paddingRight: 16,
  },
  milestoneSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#A7F3D0',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  milestoneDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
  },
  timeline: {
    paddingLeft: 16,
    paddingTop: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 28,
    top: 30,
    bottom: 20,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  activeTimelineItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginLeft: -12,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  node: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    zIndex: 2,
    marginTop: 2,
  },
  nodeDone: {
    borderColor: '#145E4C',
    backgroundColor: '#145E4C',
  },
  nodeLocked: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  activeNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
    zIndex: 2,
  },
  activeNodeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  activeContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTextContainer: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  timelineSubtitle: {
    fontSize: 12,
    color: '#4B5563',
  },
  textLocked: {
    color: '#9CA3AF',
  },
  timelineCheck: {
    marginLeft: 12,
  },
  activeTimelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  activeTimelineSubtitle: {
    fontSize: 12,
    color: '#D97706',
  },
  nextUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextUpBadge: {
    backgroundColor: '#92400E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextUpText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  micIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#92400E',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
