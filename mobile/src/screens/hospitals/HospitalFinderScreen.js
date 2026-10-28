import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import {
  HospitalCard,
  HospitalSearchBar,
  HospitalFilter,
  LocationButton,
  LoadingSpinner,
  ErrorMessage,
} from '../../components';
import { hospitalService } from '../../services/hospitalService';

export default function HospitalFinderScreen({ navigation }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [pmjayOnly, setPmjayOnly] = useState(false);

  // Active Location Coordinates (or null if manual text search only)
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [activeLocationName, setActiveLocationName] = useState('Nearby hospitals in Pune');

  // Fetch hospitals using currently active filters & coordinates
  const fetchHospitals = useCallback(
    async (coords = currentCoords, citySearch = searchTerm, pmjay = pmjayOnly) => {
      try {
        setLoading(true);
        setError('');

        const options = {};

        if (coords) {
          options.latitude = coords.latitude;
          options.longitude = coords.longitude;
          options.radius = 25; // 25 km radius
        }

        if (citySearch && citySearch.trim()) {
          options.search = citySearch.trim();
        } else if (!coords) {
          // Default city if no GPS coords and no explicit search
          options.city = 'Pune';
        }

        if (pmjay) {
          options.pmjay = true;
        }

        const data = await hospitalService.getHospitals(options);

        if (data && data.success) {
          setHospitals(data.hospitals || []);
        } else {
          setHospitals([]);
          setError(data?.message || 'Unable to retrieve hospitals.');
        }
      } catch (err) {
        console.warn('[HospitalFinderScreen] Fetch error:', err);
        const apiMessage = err.response?.data?.message;
        setError(apiMessage || 'Unable to connect to the server. Please check your connection.');
        setHospitals([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentCoords, searchTerm, pmjayOnly]
  );

  // Request device location and fetch nearby hospitals
  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setError('');
      setLocationDenied(false);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setCurrentCoords(null);
        setActiveLocationName('Search by city or area');
        // Fallback to text search for Pune
        fetchHospitals(null, searchTerm, pmjayOnly);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentCoords(coords);
      setActiveLocationName('Nearby your current location');
      fetchHospitals(coords, searchTerm, pmjayOnly);
    } catch (err) {
      console.warn('[HospitalFinderScreen] Location error:', err);
      setLocationDenied(true);
      setActiveLocationName('Search by city or area');
      fetchHospitals(null, searchTerm, pmjayOnly);
    } finally {
      setLocating(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHospitals(null, '', false);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHospitals(currentCoords, searchTerm, pmjayOnly);
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      setActiveLocationName(`Results for "${searchTerm.trim()}"`);
    } else if (currentCoords) {
      setActiveLocationName('Nearby your current location');
    } else {
      setActiveLocationName('Nearby hospitals in Pune');
    }
    fetchHospitals(currentCoords, searchTerm, pmjayOnly);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (currentCoords) {
      setActiveLocationName('Nearby your current location');
    } else {
      setActiveLocationName('Nearby hospitals in Pune');
    }
    fetchHospitals(currentCoords, '', pmjayOnly);
  };

  const handleTogglePmjay = () => {
    const nextState = !pmjayOnly;
    setPmjayOnly(nextState);
    fetchHospitals(currentCoords, searchTerm, nextState);
  };

  const handleSelectHospital = (hospital) => {
    navigation.navigate('HospitalDetails', {
      hospital,
      hospitalId: hospital.hospital_id,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Hospital Finder</Text>
          <Text style={styles.headerSubtitle}>{activeLocationName}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Field */}
        <HospitalSearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmit={handleSearchSubmit}
          onClear={handleClearSearch}
          placeholder="Search hospitals or areas..."
        />

        {/* Filter/Action Row */}
        <View style={styles.filterActionRow}>
          <LocationButton
            onPress={handleUseCurrentLocation}
            loading={locating}
            isActive={Boolean(currentCoords)}
          />
          <HospitalFilter active={pmjayOnly} onToggle={handleTogglePmjay} />
        </View>

        {/* Location Denied Amber Alert */}
        {locationDenied ? (
          <View style={styles.locationDeniedAlert}>
            <Text style={styles.locationDeniedText}>
              📍 Location permission denied. Search by city or area name above.
            </Text>
          </View>
        ) : null}

        {/* Results Count & Filter Status Row */}
        <View style={styles.resultsCountRow}>
          <Text style={styles.resultsCountText}>
            {hospitals.length} {hospitals.length === 1 ? 'hospital' : 'hospitals'} found
          </Text>
          {pmjayOnly ? (
            <View style={styles.filterActiveTag}>
              <Text style={styles.filterActiveText}>PM-JAY Filter Active</Text>
            </View>
          ) : null}
        </View>

        {/* Error Message */}
        {error ? <ErrorMessage message={error} /> : null}

        {/* Loading Spinner */}
        {loading && !refreshing ? (
          <View style={styles.loadingArea}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>Locating hospitals...</Text>
          </View>
        ) : (
          <>
            {/* Hospital Cards List */}
            {hospitals.length > 0 ? (
              hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.hospital_id}
                  hospital={hospital}
                  onPress={handleSelectHospital}
                />
              ))
            ) : (
              /* Empty States per Section 29 */
              <View style={styles.emptyContainer}>
                <View style={styles.emptyEmojiCircle}>
                  <Text style={styles.emptyEmoji}>🏥</Text>
                </View>
                {pmjayOnly ? (
                  <>
                    <Text style={styles.emptyTitle}>No PM-JAY hospitals found</Text>
                    <Text style={styles.emptySupporting}>
                      Try searching a different area or disable the PM-JAY filter.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyActionButton}
                      onPress={handleTogglePmjay}
                    >
                      <Text style={styles.emptyActionText}>Remove PM-JAY Filter</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyTitle}>No hospitals found</Text>
                    <Text style={styles.emptySupporting}>
                      Try a different search term or area.
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* Bottom Reference Note */}
            <Text style={styles.bottomReferenceNote}>
              Hospital data is for reference. Always verify before visiting.
            </Text>
          </>
        )}
      </ScrollView>
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
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingBottom: 16,
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0F2FE',
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  filterActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  locationDeniedAlert: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  locationDeniedText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  resultsCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterActiveTag: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  filterActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  loadingArea: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySupporting: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomReferenceNote: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 10,
    fontStyle: 'italic',
  },
});
