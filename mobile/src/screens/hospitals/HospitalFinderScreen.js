import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import {
  HospitalCard,
  HospitalSearchBar,
  HospitalFilter,
  LocationButton,
  LoadingSpinner,
  ErrorMessage,
  LocationSelectorPanel,
} from '../../components';
import { hospitalService } from '../../services/hospitalService';
import { useLanguage } from '../../context/LanguageContext';

export default function HospitalFinderScreen({ navigation }) {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locating, setLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Mode Toggle: 'current' (GPS) vs 'manual' (Administrative cascading selectors)
  const [searchMode, setSearchMode] = useState('current');

  // Configurable Radius (default 25 km, expandable to 50km, 100km)
  const [radiusKm, setRadiusKm] = useState(25);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [pmjayOnly, setPmjayOnly] = useState(false);

  // Active Location Coordinates (Current Location Mode)
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const [activeLocationName, setActiveLocationName] = useState('All Maharashtra Hospitals');

  // Cascading Administrative Location State (Select Location Mode)
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubDistricts, setAvailableSubDistricts] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSubDistrict, setSelectedSubDistrict] = useState('');

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);

  // Load available states once
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const data = await hospitalService.getLocations();
        if (data && data.success && data.states) {
          setAvailableStates(data.states.map((s) => s.name));
        }
      } catch (err) {
        console.warn('[HospitalFinderScreen] Failed to load states:', err);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch districts when state changes
  const handleSelectState = async (stateName) => {
    setSelectedState(stateName);
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    setAvailableDistricts([]);
    setAvailableSubDistricts([]);

    try {
      setLoadingDistricts(true);
      const data = await hospitalService.getLocations({ state: stateName });
      if (data && data.success && data.districts) {
        setAvailableDistricts(data.districts.map((d) => d.name));
      }
    } catch (err) {
      console.warn('[HospitalFinderScreen] Failed to load districts:', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch sub-districts when district changes
  const handleSelectDistrict = async (districtName) => {
    setSelectedDistrict(districtName);
    setSelectedSubDistrict('');
    setAvailableSubDistricts([]);

    try {
      setLoadingSubDistricts(true);
      const data = await hospitalService.getLocations({
        state: selectedState || 'Maharashtra',
        district: districtName,
      });
      if (data && data.success && data.subDistricts) {
        setAvailableSubDistricts(data.subDistricts);
      }
    } catch (err) {
      console.warn('[HospitalFinderScreen] Failed to load sub-districts:', err);
    } finally {
      setLoadingSubDistricts(false);
    }
  };

  const handleSelectSubDistrict = (subDistrictName) => {
    setSelectedSubDistrict(subDistrictName);
  };

  const handleResetManualLocation = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    setAvailableDistricts([]);
    setAvailableSubDistricts([]);
    setActiveLocationName('All Maharashtra Hospitals');
    fetchHospitals({
      targetPage: 1,
      isAppend: false,
      mode: 'current',
      state: null,
      dist: null,
      subDist: null,
    });
  };

  // Unified fetch hospitals function
  const fetchHospitals = useCallback(
    async ({
      coords = currentCoords,
      radius = radiusKm,
      search = searchTerm,
      pmjay = pmjayOnly,
      targetPage = 1,
      isAppend = false,
      mode = searchMode,
      state = selectedState,
      dist = selectedDistrict,
      subDist = selectedSubDistrict,
    } = {}) => {
      try {
        if (targetPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError('');

        const options = {
          page: targetPage,
          limit: 20,
        };

        if (mode === 'current' && coords) {
          options.latitude = coords.latitude;
          options.longitude = coords.longitude;
          options.radius = radius;
        }

        if (mode === 'manual') {
          if (state) options.state = state;
          if (dist) options.district = dist;
          if (subDist) options.sub_district = subDist;
        }

        if (search && search.trim()) {
          options.search = search.trim();
        }

        if (pmjay) {
          options.pmjay = true;
        }

        const data = await hospitalService.getHospitals(options);

        if (data && data.success) {
          const newHospitals = data.hospitals || [];
          setTotalCount(data.total !== undefined ? data.total : newHospitals.length);

          if (isAppend) {
            setHospitals((prev) => [...prev, ...newHospitals]);
          } else {
            setHospitals(newHospitals);
          }

          setPage(targetPage);
          setHasMore(targetPage < (data.totalPages || 1));
        } else {
          if (!isAppend) setHospitals([]);
          setError(data?.message || 'Unable to retrieve hospitals.');
          setHasMore(false);
        }
      } catch (err) {
        console.warn('[HospitalFinderScreen] Fetch error:', err);
        const apiMessage = err.response?.data?.message;
        setError(apiMessage || 'Unable to connect to the server. Please check your connection.');
        if (!isAppend) setHospitals([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [currentCoords, radiusKm, searchTerm, pmjayOnly, searchMode, selectedState, selectedDistrict, selectedSubDistrict]
  );

  // Request device location and fetch nearby hospitals sorted by distance
  const handleUseCurrentLocation = async (customRadius = radiusKm) => {
    setSearchMode('current');
    setError('');
    setLocationDenied(false);
    setLocationUnavailable(false);

    try {
      setLocating(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setCurrentCoords(null);
        setActiveLocationName('Search by district or hospital name');
        fetchHospitals({ coords: null, mode: 'current', targetPage: 1 });
        return;
      }

      // Check if location services are enabled on device
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationUnavailable(true);
        setCurrentCoords(null);
        setActiveLocationName('Location services disabled');
        fetchHospitals({ coords: null, mode: 'current', targetPage: 1 });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!location || !location.coords) {
        throw new Error('Location coordinates unavailable');
      }

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentCoords(coords);
      setActiveLocationName(`Nearby (${customRadius} km radius)`);
      fetchHospitals({ coords, radius: customRadius, mode: 'current', targetPage: 1 });
    } catch (err) {
      console.warn('[HospitalFinderScreen] Location error:', err);
      setLocationUnavailable(true);
      setActiveLocationName('Search by district or hospital name');
      fetchHospitals({ coords: null, mode: 'current', targetPage: 1 });
    } finally {
      setLocating(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHospitals({ targetPage: 1, isAppend: false });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHospitals({ targetPage: 1, isAppend: false });
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      setActiveLocationName(`Results for "${searchTerm.trim()}"`);
    } else if (searchMode === 'manual' && selectedState) {
      const parts = [selectedSubDistrict, selectedDistrict, selectedState].filter(Boolean);
      setActiveLocationName(parts.join(' > '));
    } else if (currentCoords) {
      setActiveLocationName(`Nearby (${radiusKm} km radius)`);
    } else {
      setActiveLocationName('All Maharashtra Hospitals');
    }
    fetchHospitals({ targetPage: 1, isAppend: false });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchMode === 'manual' && selectedState) {
      const parts = [selectedSubDistrict, selectedDistrict, selectedState].filter(Boolean);
      setActiveLocationName(parts.join(' > '));
    } else if (currentCoords) {
      setActiveLocationName(`Nearby (${radiusKm} km radius)`);
    } else {
      setActiveLocationName('All Maharashtra Hospitals');
    }
    fetchHospitals({ search: '', targetPage: 1, isAppend: false });
  };

  const handleTogglePmjay = () => {
    const nextState = !pmjayOnly;
    setPmjayOnly(nextState);
    fetchHospitals({ pmjay: nextState, targetPage: 1, isAppend: false });
  };

  const handleApplyManualSearch = () => {
    const parts = [selectedSubDistrict, selectedDistrict, selectedState].filter(Boolean);
    setActiveLocationName(parts.length > 0 ? parts.join(' > ') : 'All Maharashtra Hospitals');
    fetchHospitals({
      mode: 'manual',
      state: selectedState,
      dist: selectedDistrict,
      subDist: selectedSubDistrict,
      targetPage: 1,
      isAppend: false,
    });
  };

  const handleRadiusChange = (newRadius) => {
    setRadiusKm(newRadius);
    if (currentCoords) {
      setActiveLocationName(`Nearby (${newRadius} km radius)`);
      fetchHospitals({
        coords: currentCoords,
        radius: newRadius,
        mode: 'current',
        targetPage: 1,
        isAppend: false,
      });
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchHospitals({ targetPage: page + 1, isAppend: true });
    }
  };

  const handleSelectHospital = (hospital) => {
    navigation.navigate('HospitalDetails', {
      hospital,
      hospitalId: hospital.hospital_id,
    });
  };

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Search Bar */}
      <HospitalSearchBar
        value={searchTerm}
        onChangeText={setSearchTerm}
        onSubmit={handleSearchSubmit}
        onClear={handleClearSearch}
        placeholder={t('hospital.searchPlaceholder')}
      />

      {/* Mode Switcher: Current Location vs Select Location */}
      <View style={styles.modeSwitcherContainer}>
        <TouchableOpacity
          style={[
            styles.modeTab,
            searchMode === 'current' && styles.modeTabActive,
          ]}
          onPress={() => {
            setSearchMode('current');
            if (currentCoords) {
              setActiveLocationName(`Nearby (${radiusKm} km radius)`);
            } else {
              setActiveLocationName('All Maharashtra Hospitals');
            }
            fetchHospitals({ mode: 'current', targetPage: 1, isAppend: false });
          }}
        >
          <Text
            style={[
              styles.modeTabText,
              searchMode === 'current' && styles.modeTabTextActive,
            ]}
          >
            📍 Current Location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeTab,
            searchMode === 'manual' && styles.modeTabActive,
          ]}
          onPress={() => setSearchMode('manual')}
        >
          <Text
            style={[
              styles.modeTabText,
              searchMode === 'manual' && styles.modeTabTextActive,
            ]}
          >
            🏛️ Select Location
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual Cascading Selectors Panel (when manual mode is active) */}
      {searchMode === 'manual' ? (
        <LocationSelectorPanel
          country="India"
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedSubDistrict={selectedSubDistrict}
          states={availableStates}
          districts={availableDistricts}
          subDistricts={availableSubDistricts}
          loadingStates={loadingStates}
          loadingDistricts={loadingDistricts}
          loadingSubDistricts={loadingSubDistricts}
          onSelectState={handleSelectState}
          onSelectDistrict={handleSelectDistrict}
          onSelectSubDistrict={handleSelectSubDistrict}
          onReset={handleResetManualLocation}
          onSearch={handleApplyManualSearch}
          isSearching={loading}
        />
      ) : (
        /* Action row for GPS mode */
        <View>
          <View style={styles.filterActionRow}>
            <LocationButton
              onPress={() => handleUseCurrentLocation(radiusKm)}
              loading={locating}
              isActive={Boolean(currentCoords)}
            />
            <HospitalFilter active={pmjayOnly} onToggle={handleTogglePmjay} />
          </View>

          {/* Configurable Radius Selector (when GPS location is active) */}
          {currentCoords ? (
            <View style={styles.radiusRow}>
              <Text style={styles.radiusLabel}>Search Radius:</Text>
              {[15, 25, 50, 100].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
                  onPress={() => handleRadiusChange(r)}
                >
                  <Text style={[styles.radiusChipText, radiusKm === r && styles.radiusChipTextActive]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      )}

      {/* When manual mode, show PM-JAY toggle as an independent row */}
      {searchMode === 'manual' ? (
        <View style={styles.manualPmjayRow}>
          <HospitalFilter active={pmjayOnly} onToggle={handleTogglePmjay} />
        </View>
      ) : null}

      {/* Location Denied Amber Alert */}
      {locationDenied && searchMode === 'current' ? (
        <View style={styles.locationDeniedAlert}>
          <Text style={styles.locationDeniedText}>
            📍 {t('hospital.locationDenied')}
          </Text>
          <TouchableOpacity
            style={styles.alertRetryButton}
            onPress={() => handleUseCurrentLocation(radiusKm)}
          >
            <Text style={styles.alertRetryText}>Grant Permission & Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Location Unavailable Alert */}
      {locationUnavailable && searchMode === 'current' ? (
        <View style={styles.locationDeniedAlert}>
          <Text style={styles.locationDeniedText}>
            📍 Device GPS or location services are currently unavailable. Please enable GPS in device settings or use Select Location.
          </Text>
          <TouchableOpacity
            style={styles.alertRetryButton}
            onPress={() => handleUseCurrentLocation(radiusKm)}
          >
            <Text style={styles.alertRetryText}>Retry Location</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Results Count & Filter Status Row */}
      <View style={styles.resultsCountRow}>
        <Text style={styles.resultsCountText}>
          {totalCount} {totalCount === 1 ? 'hospital' : 'hospitals'} found
          {hospitals.length > 0 && totalCount > hospitals.length ? ` (showing ${hospitals.length})` : ''}
        </Text>
        <View style={styles.statusTagsRow}>
          {currentCoords && searchMode === 'current' ? (
            <View style={styles.gpsActiveTag}>
              <Text style={styles.gpsActiveText}>Sorted by Distance</Text>
            </View>
          ) : null}
          {pmjayOnly ? (
            <View style={styles.filterActiveTag}>
              <Text style={styles.filterActiveText}>PM-JAY Active</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Error Message with Retry */}
      {error ? (
        <View style={styles.errorArea}>
          <ErrorMessage message={error} />
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchHospitals({ targetPage: 1, isAppend: false })}
          >
            <Text style={styles.retryButtonText}>↻ Retry Search</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Initial Loading Spinner */}
      {loading && !refreshing ? (
        <View style={styles.loadingArea}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>
            {locating ? 'Acquiring GPS coordinates...' : 'Finding nearby hospitals...'}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#0284C7" />
          <Text style={styles.loadingMoreText}>Loading more hospitals...</Text>
        </View>
      );
    }

    if (!loading && hospitals.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.bottomReferenceNote}>
            Hospital data verified with official NHA PM-JAY registry. Distances calculated based on verified facility coordinates.
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;

    // Specific empty state when in Current Location GPS mode with 0 hospitals found
    if (searchMode === 'current' && currentCoords) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyEmojiCircle}>
            <Text style={styles.emptyEmoji}>📍</Text>
          </View>
          <Text style={styles.emptyTitle}>No hospitals found within {radiusKm} km</Text>
          <Text style={styles.emptySupporting}>
            We could not find any hospitals with stored coordinates within {radiusKm} km of your device location.
            You can widen the search radius or manually select your district.
          </Text>
          <View style={styles.emptyActionsRow}>
            {radiusKm < 100 && (
              <TouchableOpacity
                style={styles.widenButton}
                onPress={() => handleRadiusChange(Math.min(radiusKm * 2, 100))}
              >
                <Text style={styles.widenButtonText}>
                  Widen to {Math.min(radiusKm * 2, 100)} km
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.manualFallbackButton}
              onPress={() => setSearchMode('manual')}
            >
              <Text style={styles.manualFallbackText}>Select Location Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyEmojiCircle}>
          <Text style={styles.emptyEmoji}>🏥</Text>
        </View>
        {pmjayOnly ? (
          <>
            <Text style={styles.emptyTitle}>No PM-JAY hospitals found</Text>
            <Text style={styles.emptySupporting}>
              Try selecting a different district/sub-district or disable the PM-JAY filter.
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
              Try selecting a broader administrative location (e.g. State or District level) or adjusting your search term.
            </Text>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{t('hospital.title')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {activeLocationName}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={loading ? [] : hospitals}
        keyExtractor={(item) => String(item.hospital_id)}
        renderItem={({ item }) => (
          <HospitalCard
            hospital={item}
            onPress={handleSelectHospital}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
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
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: 'bold',
    marginTop: -2,
  },
  headerTitleCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '500',
    marginTop: 2,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listHeaderContainer: {
    paddingTop: 16,
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  filterActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 4,
  },
  radiusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  radiusChipActive: {
    backgroundColor: '#0284C7',
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },
  manualPmjayRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  locationDeniedAlert: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  locationDeniedText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 6,
  },
  alertRetryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertRetryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statusTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gpsActiveTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  filterActiveTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  filterActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  errorArea: {
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#0284C7',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '500',
  },
  footerContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySupporting: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  widenButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  widenButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  manualFallbackButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualFallbackText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  emptyActionButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomReferenceNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
});
