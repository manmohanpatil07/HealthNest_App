import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { COLORS } from '../../constants';
import { LoadingSpinner, ErrorMessage, UserBottomNav } from '../../components';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SERVER_ROOT_URL } from '../../services/api';

export default function DashboardScreen({ navigation }) {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setError('');
      const response = await userService.getDashboard();
      if (response && response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.warn('[DashboardScreen] fetchDashboard error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const userName = dashboardData?.user?.full_name || authUser?.full_name || 'User';
  const profileImageUrl = dashboardData?.user?.profile_image_url || authUser?.profile_image_url;
  const bloodGroup = dashboardData?.healthStatus?.bloodGroup || authUser?.blood_group || 'Not set';
  const healthStatus = dashboardData?.healthStatus;
  const upcomingVaccine = dashboardData?.upcomingVaccination;
  const recentRecords = dashboardData?.recentRecords || [];

  // Helper to get translated status title based on data state
  const getStatusDisplay = () => {
    if (!healthStatus) {
      return {
        title: t('dashboard.healthStatus'),
        reason: t('dashboard.lastUpdated'),
        emoji: '📋',
        badgeBg: 'rgba(255, 255, 255, 0.15)',
        textColor: '#FFFFFF',
      };
    }

    switch (healthStatus.state) {
      case 'attention_needed':
        return {
          title: t('dashboard.statusAttention'),
          reason: healthStatus.reason,
          emoji: '⚠️',
          badgeBg: '#FEF2F2',
          textColor: '#DC2626',
        };
      case 'upcoming_reminder':
        return {
          title: t('dashboard.statusUpcoming'),
          reason: healthStatus.reason,
          emoji: '⏰',
          badgeBg: '#FFFBEB',
          textColor: '#D97706',
        };
      case 'no_pending_reminders':
        return {
          title: t('dashboard.statusNoPending'),
          reason: healthStatus.reason,
          emoji: '✓',
          badgeBg: '#F0FDF4',
          textColor: '#16A34A',
        };
      case 'add_health_info':
      default:
        return {
          title: t('dashboard.statusAddInfo'),
          reason: healthStatus.reason,
          emoji: '📋',
          badgeBg: 'rgba(255, 255, 255, 0.2)',
          textColor: '#FFFFFF',
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDashboard();
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Top Hero Section per Section 22 */}
        <View style={styles.heroSection}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>{t('dashboard.goodMorning')}</Text>
              <Text style={styles.userName}>{userName} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => navigation.navigate('Profile')}
            >
              {profileImageUrl ? (
                <Image
                  source={{
                    uri: profileImageUrl.startsWith('http')
                      ? profileImageUrl
                      : `${SERVER_ROOT_URL}${profileImageUrl}`,
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarEmoji}>
                  {dashboardData?.user?.gender === 'Female' ? '👩' : '👨'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Transparent Record-Based Health Summary Card */}
          <View style={styles.healthStatusCard}>
            <View style={styles.healthStatusLeft}>
              <View style={styles.statusBadgeRow}>
                <Text style={styles.healthStatusTitle}>{t('dashboard.healthStatus')}</Text>
                <View style={[styles.indicatorPill, { backgroundColor: statusInfo.badgeBg }]}>
                  <Text style={styles.indicatorEmoji}>{statusInfo.emoji}</Text>
                  <Text style={[styles.indicatorText, { color: statusInfo.textColor }]}>
                    {statusInfo.title}
                  </Text>
                </View>
              </View>
              <Text style={styles.healthStatusReason} numberOfLines={2}>
                {statusInfo.reason}
              </Text>
              <Text style={styles.healthStatusDisclaimer}>
                {t('dashboard.notMedicalAdvice')}
              </Text>
            </View>
            <View style={styles.healthStatusRight}>
              <Text style={styles.bloodLabel}>{t('dashboard.bloodGroup')}</Text>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>{bloodGroup}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {error ? <ErrorMessage message={error} /> : null}

          {loading ? (
            <LoadingSpinner message={t('dashboard.loadSummary')} />
          ) : (
            <>
              {/* Quick Access Section per Section 22 */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t('dashboard.quickAccess')}</Text>
              </View>

              {/* First row: 3 cards (Health Records, Documents, Vaccination) */}
              <View style={styles.quickAccessRow}>
                <TouchableOpacity
                  style={[styles.quickCard, styles.skyCard]}
                  onPress={() => navigation.navigate('HealthRecords')}
                >
                  <View style={[styles.quickIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={styles.quickEmoji}>📋</Text>
                  </View>
                  <Text style={styles.quickLabel}>{t('records.title')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickCard, styles.purpleCard]}
                  onPress={() => navigation.navigate('Documents')}
                >
                  <View style={[styles.quickIconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <Text style={styles.quickEmoji}>📄</Text>
                  </View>
                  <Text style={styles.quickLabel}>{t('documents.title')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickCard, styles.greenCard]}
                  onPress={() => navigation.navigate('Vaccination')}
                >
                  <View style={[styles.quickIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={styles.quickEmoji}>💉</Text>
                  </View>
                  <Text style={styles.quickLabel}>{t('vaccine.title')}</Text>
                </TouchableOpacity>
              </View>

              {/* Second row: 2 cards (QR Health Card, Hospital Finder) */}
              <View style={styles.quickAccessRow}>
                <TouchableOpacity
                  style={[styles.quickCardLarge, styles.amberCard]}
                  onPress={() => navigation.navigate('QRHealthCard')}
                >
                  <View style={[styles.quickIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.quickEmoji}>🪪</Text>
                  </View>
                  <Text style={styles.quickLabel}>{t('qrCard.title')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickCardLarge, styles.skyCard]}
                  onPress={() => navigation.navigate('HospitalFinder')}
                >
                  <View style={[styles.quickIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={styles.quickEmoji}>🏥</Text>
                  </View>
                  <Text style={styles.quickLabel}>{t('hospital.title')}</Text>
                </TouchableOpacity>
              </View>

              {/* Upcoming Section per Section 22 */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t('dashboard.upcomingVaccination')}</Text>
              </View>

              {upcomingVaccine ? (
                <TouchableOpacity
                  style={styles.upcomingVaccineCard}
                  onPress={() => navigation.navigate('Vaccination')}
                  activeOpacity={0.8}
                >
                  <View style={styles.upcomingLeftIcon}>
                    <Text style={{ fontSize: 22 }}>💉</Text>
                  </View>
                  <View style={styles.upcomingDetails}>
                    <Text style={styles.upcomingTag}>Vaccination Due</Text>
                    <Text style={styles.upcomingName}>{upcomingVaccine.vaccine_name}</Text>
                    <Text style={styles.upcomingDate}>
                      Due: {upcomingVaccine.next_due_date ? new Date(upcomingVaccine.next_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Upcoming'}
                    </Text>
                  </View>
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningBadgeText}>Upcoming</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.upcomingVaccineCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
                  onPress={() => navigation.navigate('Vaccination')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.upcomingLeftIcon, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={{ fontSize: 22 }}>💉</Text>
                  </View>
                  <View style={styles.upcomingDetails}>
                    <Text style={[styles.upcomingTag, { color: '#64748B' }]}>Vaccination Schedule</Text>
                    <Text style={[styles.upcomingName, { color: '#334155' }]}>No upcoming vaccines due</Text>
                    <Text style={styles.upcomingDate}>Tap to record past or future doses</Text>
                  </View>
                  <View style={[styles.warningBadge, { backgroundColor: '#E2E8F0' }]}>
                    <Text style={[styles.warningBadgeText, { color: '#64748B' }]}>Track</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Recent Records Section per Section 22 */}
              <View style={styles.sectionHeaderWithAction}>
                <Text style={styles.sectionLabel}>{t('dashboard.recentRecords')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('HealthRecords')}>
                  <Text style={styles.viewAllText}>{t('dashboard.viewAll')}</Text>
                </TouchableOpacity>
              </View>

              {recentRecords.length > 0 ? (
                recentRecords.map((rec) => {
                  const getIcon = (type) => {
                    switch (type) {
                      case 'Blood Test': return '🩸';
                      case 'Prescription': return '💊';
                      case 'Consultation': return '👨‍⚕️';
                      case 'Radiology': return '🔬';
                      default: return '📋';
                    }
                  };
                  return (
                    <TouchableOpacity
                      key={rec.record_id}
                      style={styles.recordCard}
                      onPress={() => navigation.navigate('HealthRecords')}
                    >
                      <View style={styles.recordIconCircle}>
                        <Text style={{ fontSize: 20 }}>{getIcon(rec.record_type)}</Text>
                      </View>
                      <View style={styles.recordInfo}>
                        <Text style={styles.recordCategory}>{rec.record_type}</Text>
                        <Text style={styles.recordTitle}>{rec.title}</Text>
                        <Text style={styles.recordDate}>
                          {rec.record_date ? new Date(rec.record_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </Text>
                      </View>
                      <View style={styles.savedBadge}>
                        <Text style={styles.savedBadgeText}>Saved</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={[styles.recordCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}>
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>📋</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '500' }}>{t('dashboard.noRecentRecords')}</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('HealthRecords')}
                    style={{ marginTop: 8 }}
                  >
                    <Text style={{ color: '#0284C7', fontWeight: '700', fontSize: 13 }}>{t('records.addRecord')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* QR CTA Card per Section 22 */}
              <TouchableOpacity
                style={styles.qrCtaCard}
                onPress={() => navigation.navigate('QRHealthCard')}
                activeOpacity={0.85}
              >
                <View style={styles.qrCtaLeft}>
                  <View style={styles.qrIconBox}>
                    <Text style={{ fontSize: 26 }}>🪪</Text>
                  </View>
                  <View style={styles.qrCtaTextCol}>
                    <Text style={styles.qrCtaTitle}>{t('qrCard.title')}</Text>
                    <Text style={styles.qrCtaSubtitle}>
                      {t('dashboard.qrHealthCardSub')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.qrCtaChevron}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* User Bottom Navigation with Home active per Section 12 & 22 */}
      <UserBottomNav activeTab="Home" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  healthStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  healthStatusLeft: {
    flex: 1,
    marginRight: 10,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  healthStatusTitle: {
    fontSize: 12,
    color: '#E0F2FE',
    fontWeight: '600',
  },
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  indicatorEmoji: {
    fontSize: 11,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  healthStatusReason: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
  },
  healthStatusDisclaimer: {
    fontSize: 10,
    color: '#BAE6FD',
    fontStyle: 'italic',
  },
  healthStatusRight: {
    alignItems: 'center',
  },
  bloodLabel: {
    fontSize: 11,
    color: '#E0F2FE',
    marginBottom: 6,
    fontWeight: '600',
  },
  bloodBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bloodText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 10,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  quickCardLarge: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickEmoji: {
    fontSize: 22,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  upcomingVaccineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  upcomingLeftIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingDetails: {
    flex: 1,
  },
  upcomingTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
    marginBottom: 2,
  },
  upcomingName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  upcomingDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  warningBadge: {
    backgroundColor: COLORS.amberBg,
    borderColor: COLORS.amberBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warningBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  recordIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.skyBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 2,
  },
  recordDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  savedBadge: {
    backgroundColor: COLORS.greenBg,
    borderColor: COLORS.greenBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.darkTeal,
  },
  qrCtaCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  qrCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qrIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  qrCtaTextCol: {
    flex: 1,
  },
  qrCtaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  qrCtaSubtitle: {
    fontSize: 12,
    color: '#E0F2FE',
    lineHeight: 16,
  },
  qrCtaChevron: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '300',
    marginLeft: 8,
  },
});
