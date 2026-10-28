import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  HospitalStatusBadge,
  HospitalDetailsCard,
  CallButton,
  DirectionsButton,
  LoadingSpinner,
  ErrorMessage,
} from '../../components';
import { hospitalService } from '../../services/hospitalService';

/**
 * HospitalDetailsScreen - Module 3 Part 3
 *
 * Implements UI_INSTRUCTIONS.md Section 30:
 * - Dynamic hospital name in header with back action
 * - Hero banner with government (#0284C7 -> #0369A1) or private (#7C3AED -> #6D28D9) styling
 * - Badges: Hospital type, ✓ PM-JAY Empanelled
 * - Location strip and Chips: distance away, PM Ayushman Bharat eligible
 * - Structured "HOSPITAL INFO" card
 * - Action buttons: Call Hospital (or disabled No Phone Listed) and Get Directions
 * - PM-JAY informational card for PM-JAY eligible hospitals
 * - Handles loading, network errors, hospital not found, and missing data gracefully
 */
export default function HospitalDetailsScreen({ route, navigation }) {
  const { hospital: initialHospital, hospitalId } = route.params || {};

  const [hospital, setHospital] = useState(initialHospital || null);
  const [loading, setLoading] = useState(!initialHospital);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const targetId = hospitalId || initialHospital?.hospital_id;

  const fetchDetails = async (isPullToRefresh = false) => {
    if (!targetId) {
      setError('Hospital identifier was not provided.');
      setLoading(false);
      return;
    }

    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else if (!hospital) {
        setLoading(true);
      }
      setError('');

      const response = await hospitalService.getHospitalDetails(targetId);

      if (response && response.success && response.hospital) {
        // If initialHospital had distance_km computed from search, preserve it
        const fetchedData = response.hospital;
        if (initialHospital?.distance_km !== undefined && fetchedData.distance_km === undefined) {
          fetchedData.distance_km = initialHospital.distance_km;
        }
        setHospital(fetchedData);
      } else {
        setError(response?.message || 'Hospital details not found.');
      }
    } catch (err) {
      console.warn('[HospitalDetailsScreen] Error loading details:', err);
      const apiMessage = err.response?.data?.message;
      if (err.response?.status === 404) {
        setError('The requested hospital could not be found.');
      } else {
        setError(apiMessage || 'Unable to load hospital details. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [targetId]);

  const onRefresh = () => {
    fetchDetails(true);
  };

  const isGovernment =
    hospital?.hospital_type &&
    hospital.hospital_type.toLowerCase().includes('government');

  const isPmjay = Boolean(hospital?.pmjay_status);
  const isVerified = isPmjay && Boolean(hospital?.verified_at);

  const distance =
    hospital?.distance_km !== null &&
    hospital?.distance_km !== undefined &&
    !isNaN(hospital?.distance_km)
      ? `${parseFloat(hospital.distance_km).toFixed(1)} km`
      : null;

  return (
    <View style={styles.container}>
      {/* Header matching UI_INSTRUCTIONS */}
      <View style={[styles.header, isGovernment ? styles.govHeader : styles.privateHeader]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back to hospital list"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {hospital?.hospital_name || 'Hospital Details'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {hospital?.city ? `${hospital.city}, ${hospital.state || ''}` : 'Hospital Information'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading hospital details...</Text>
        </View>
      ) : error && !hospital ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorEmojiCircle}>
            <Text style={styles.errorEmoji}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Hospital Not Found</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchDetails(false)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.returnButtonText}>Back to Hospital List</Text>
          </TouchableOpacity>
        </View>
      ) : hospital ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0284C7']}
            />
          }
        >
          {error ? <ErrorMessage message={error} /> : null}

          {/* Hero Banner with Government or Private Colors */}
          <View
            style={[
              styles.heroBanner,
              isGovernment ? styles.govHeroBanner : styles.privateHeroBanner,
            ]}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Text style={styles.heroIconEmoji}>🏥</Text>
              </View>
              <View style={styles.heroBadgesCol}>
                <View style={styles.heroBadgesRow}>
                  {hospital.hospital_type ? (
                    <View style={styles.heroTypeBadge}>
                      <Text style={styles.heroTypeBadgeText}>
                        {hospital.hospital_type}
                      </Text>
                    </View>
                  ) : null}
                  {isPmjay ? (
                    <View
                      style={[
                        styles.heroPmjayBadge,
                        isVerified
                          ? styles.heroPmjayVerifiedBadge
                          : styles.heroPmjayUnverifiedBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.heroPmjayBadgeText,
                          isVerified
                            ? styles.heroPmjayVerifiedText
                            : styles.heroPmjayUnverifiedText,
                        ]}
                      >
                        {isVerified ? '✓ PM-JAY Empanelled' : 'PM-JAY Listed'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <Text style={styles.heroHospitalName} numberOfLines={2}>
              {hospital.hospital_name}
            </Text>

            {/* Address / Location Strip in Hero */}
            <View style={styles.heroLocationStrip}>
              <Text style={styles.heroLocationIcon}>📍</Text>
              <Text style={styles.heroLocationText} numberOfLines={2}>
                {[hospital.address, hospital.city, hospital.state, hospital.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          </View>

          {/* Chips Section */}
          <View style={styles.chipsRow}>
            {distance ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>📍 {distance} away</Text>
              </View>
            ) : null}
            {isPmjay ? (
              <View style={[styles.chip, styles.pmjayChip]}>
                <Text style={styles.pmjayChipText}>
                  🛡️ PM Ayushman Bharat eligible
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons: Call & Directions (Section 30) */}
          <View style={styles.actionsContainer}>
            <CallButton
              phone={hospital.phone}
              style={styles.actionButton}
            />
            <View style={{ width: 12 }} />
            <DirectionsButton
              latitude={hospital.latitude}
              longitude={hospital.longitude}
              hospitalName={hospital.hospital_name}
              address={hospital.address}
              style={styles.actionButton}
            />
          </View>

          {/* Hospital Info Card */}
          <HospitalDetailsCard hospital={hospital} />

          {/* PM-JAY Info Card (Only when PM-JAY is true, Section 30) */}
          {isPmjay ? (
            <View style={styles.pmjayInfoCard}>
              <Text style={styles.pmjayInfoHeader}>
                ℹ️ About PM-JAY (Ayushman Bharat)
              </Text>
              <Text style={styles.pmjayInfoBody}>
                Pradhan Mantri Jan Arogya Yojana (PM-JAY) offers health coverage
                of up to ₹5 lakh per family per year for secondary and tertiary
                care hospitalization.
              </Text>
              {isVerified ? (
                <View style={styles.pmjayVerifiedNote}>
                  <Text style={styles.pmjayVerifiedNoteText}>
                    ✓ Verified empanelled healthcare facility. Present your
                    Ayushman card at the PM-JAY helpdesk at admission.
                  </Text>
                </View>
              ) : (
                <View style={styles.pmjayNoticeNote}>
                  <Text style={styles.pmjayNoticeNoteText}>
                    Please confirm empanelment status with the hospital
                    administration prior to seeking PM-JAY admissions.
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Bottom Reference Note */}
          <Text style={styles.bottomDisclaimer}>
            Hospital information is provided for guidance. In emergencies,
            always contact national emergency services immediately (112 or 108).
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingBottom: 16,
  },
  govHeader: {
    backgroundColor: '#0284C7', // Government primary blue
  },
  privateHeader: {
    backgroundColor: '#7C3AED', // Private hospital purple
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleCol: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  returnButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  returnButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  govHeroBanner: {
    backgroundColor: '#0284C7', // UI_INSTRUCTIONS Section 30: #0284C7 -> #0369A1
  },
  privateHeroBanner: {
    backgroundColor: '#7C3AED', // UI_INSTRUCTIONS Section 30: #7C3AED -> #6D28D9
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  heroIconEmoji: {
    fontSize: 24,
  },
  heroBadgesCol: {
    flex: 1,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroPmjayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroPmjayVerifiedBadge: {
    backgroundColor: '#FAF5FF',
  },
  heroPmjayVerifiedText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '800',
  },
  heroPmjayUnverifiedBadge: {
    backgroundColor: '#FFFBEB',
  },
  heroPmjayUnverifiedText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },
  heroHospitalName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 10,
  },
  heroLocationStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  heroLocationIcon: {
    fontSize: 13,
    marginRight: 6,
    marginTop: 1,
  },
  heroLocationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
  },
  pmjayChip: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  pmjayChipText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  pmjayInfoCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  pmjayInfoHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 8,
  },
  pmjayInfoBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  pmjayVerifiedNote: {
    backgroundColor: '#F3E8FF',
    padding: 10,
    borderRadius: 8,
  },
  pmjayVerifiedNoteText: {
    fontSize: 11,
    color: '#5B21B6',
    fontWeight: '600',
    lineHeight: 16,
  },
  pmjayNoticeNote: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
  },
  pmjayNoticeNoteText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 16,
  },
  bottomDisclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 8,
  },
});
