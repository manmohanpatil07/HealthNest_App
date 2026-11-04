import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Alert,
  Linking,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { providerService } from '../../services/providerService';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = 260;

export default function ScanQRScreen({ navigation }) {
  const { t } = useLanguage();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'scanning' | 'verifying' | 'success' | 'invalid' | 'expired' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [hasScanned, setHasScanned] = useState(false);

  // Manual token entry modal state
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [manualError, setManualError] = useState('');

  // Scanline animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanAnimRef = useRef(null);

  // Auto-request permission and activate scanner when screen is focused
  useEffect(() => {
    let isMounted = true;

    async function initScanner() {
      if (!isFocused) {
        setIsScanningActive(false);
        setIsCameraReady(false);
        return;
      }

      if (!permission) {
        // Permissions still loading from native module
        return;
      }

      if (permission.granted) {
        if (isMounted) {
          setIsScanningActive(true);
          setScanStatus((prev) => (prev === 'verifying' || prev === 'success' ? prev : 'scanning'));
        }
      } else if (permission.canAskAgain) {
        const res = await requestPermission();
        if (res?.granted && isMounted) {
          setIsScanningActive(true);
          setScanStatus('scanning');
        }
      }
    }

    initScanner();

    return () => {
      isMounted = false;
    };
  }, [isFocused, permission?.granted, permission?.canAskAgain, requestPermission]);

  // Handle scan line animation loop while scanning and camera is ready
  useEffect(() => {
    if (isFocused && isScanningActive && isCameraReady && !hasScanned) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: SCAN_FRAME_SIZE - 4,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnimRef.current = anim;
      anim.start();
    } else {
      if (scanAnimRef.current) {
        scanAnimRef.current.stop();
        scanAnimRef.current = null;
      }
      scanLineAnim.setValue(0);
    }

    return () => {
      if (scanAnimRef.current) {
        scanAnimRef.current.stop();
        scanAnimRef.current = null;
      }
    };
  }, [isFocused, isScanningActive, isCameraReady, hasScanned]);

  // Process any token (from camera QR scan or manual input)
  const processToken = useCallback(
    async (tokenInput) => {
      if (hasScanned || loading) return;

      let rawToken = tokenInput ? String(tokenInput).trim() : '';

      // Support JSON encoded token payload or raw string
      if (rawToken.startsWith('{') && rawToken.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawToken);
          rawToken = parsed.access_token || parsed.token || rawToken;
        } catch (e) {
          // not JSON, keep string
        }
      }

      if (!rawToken) {
        setScanStatus('invalid');
        setErrorMessage('This does not appear to be a valid HealthNest QR code. Please try again.');
        return;
      }

      setHasScanned(true);
      setIsScanningActive(false);
      setScanStatus('verifying');
      setLoading(true);

      try {
        const res = await providerService.scanQR(rawToken);

        if (res && res.success) {
          setScanStatus('success');
          setLoading(false);
          // Short delay to display green verification state before navigating
          setTimeout(() => {
            navigation.navigate('PatientDetails', {
              patient: res.patient,
              healthRecords: res.healthRecords,
              documents: res.documents,
              vaccinations: res.vaccinations,
              accessInfo: res.accessInfo,
              token: rawToken,
            });
          }, 1200);
        } else {
          setScanStatus('invalid');
          setErrorMessage(res?.message || 'Invalid or unauthorized QR code.');
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
        const errData = err.response?.data;
        const errorCode = errData?.errorCode;
        const message = errData?.message;

        if (errorCode === 'EXPIRED_QR') {
          setScanStatus('expired');
          setErrorMessage(message || 'Ask the patient to regenerate their QR code from the HealthNest app.');
        } else if (errorCode === 'INVALID_QR') {
          setScanStatus('invalid');
          setErrorMessage(message || 'This does not appear to be a valid HealthNest QR code. Please try again.');
        } else {
          setScanStatus('error');
          setErrorMessage(message || 'Unable to authorize access. Please check your connection and try again.');
        }
      }
    },
    [hasScanned, loading, navigation]
  );

  const handleBarCodeScanned = useCallback(
    ({ data }) => {
      processToken(data);
    },
    [processToken]
  );

  const handleStartScanning = async () => {
    setErrorMessage('');
    setCameraError(null);
    setHasScanned(false);

    if (!permission?.granted) {
      if (permission && !permission.canAskAgain) {
        Alert.alert(
          'Camera Permission Blocked',
          'Camera permission is permanently denied or unavailable. Please enable camera access in your device settings to scan patient QR codes.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      const result = await requestPermission();
      if (!result?.granted) {
        Alert.alert(
          'Camera Permission Required',
          "Camera access is required to scan the patient's QR Health Card. Please enable camera access in your device settings."
        );
        return;
      }
    }

    setScanStatus('scanning');
    setIsCameraReady(false);
    setIsScanningActive(true);
  };

  const handleManualSubmit = () => {
    if (!manualTokenInput.trim()) {
      setManualError('Please enter a valid QR access token.');
      return;
    }
    const token = manualTokenInput.trim();
    setManualModalVisible(false);
    setManualTokenInput('');
    setManualError('');
    processToken(token);
  };

  const hasPermission = Boolean(permission?.granted);
  const showCamera = isFocused && hasPermission && isScanningActive;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('provider.scanScreenTitle')}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              setManualError('');
              setManualModalVisible(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.headerActionIcon}>⌨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flashButton, isTorchOn ? styles.flashActive : styles.flashInactive]}
            onPress={() => setIsTorchOn(!isTorchOn)}
          >
            <Text style={styles.flashIcon}>⚡</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera / Scanner Frame Container */}
      <View style={styles.scannerWrapper}>
        {/* Layer 1: Real Native Camera Preview or Fallback Placeholder */}
        {showCamera ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.cameraFill}
              facing="back"
              enableTorch={isTorchOn}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onCameraReady={() => {
                setIsCameraReady(true);
                setCameraError(null);
              }}
              onMountError={(error) => {
                console.warn('CameraView mount error:', error);
                setCameraError(error?.message || 'Failed to start camera hardware.');
              }}
              onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
            />

            {/* Loading spinner while native camera hardware is binding */}
            {!isCameraReady && !cameraError && (
              <View style={styles.cameraLoadingOverlay}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.cameraLoadingText}>{t('provider.initializingCamera')}</Text>
              </View>
            )}

            {/* Error view if camera hardware cannot be bound */}
            {cameraError && (
              <View style={styles.cameraErrorOverlay}>
                <Text style={styles.cameraErrorIcon}>📷</Text>
                <Text style={styles.cameraErrorTitle}>Camera Unavailable</Text>
                <Text style={styles.cameraErrorMessage}>{cameraError}</Text>
                <TouchableOpacity
                  style={styles.retryCameraBtn}
                  onPress={() => {
                    setCameraError(null);
                    setIsCameraReady(false);
                    setIsScanningActive(false);
                    setTimeout(() => setIsScanningActive(true), 250);
                  }}
                >
                  <Text style={styles.retryCameraBtnText}>Retry Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderIcon}>📷</Text>
            <Text style={styles.cameraPlaceholderText}>
              {!permission
                ? t('provider.initializingCamera')
                : !permission.granted
                ? t('common.error')
                : hasScanned
                ? t('provider.qrVerified')
                : t('provider.cameraActivePrompt')}
            </Text>
            {permission && !permission.granted && (
              <TouchableOpacity
                style={styles.grantPermissionBtn}
                onPress={handleStartScanning}
              >
                <Text style={styles.grantPermissionBtnText}>Grant Camera Access</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Layer 2: Viewfinder Target Frame Overlay */}
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.overlayDarkTop} />
          <View style={styles.overlayMiddleRow}>
            <View style={styles.overlayDarkSide} />
            {/* Viewfinder Cutout */}
            <View
              style={[
                styles.targetFrame,
                scanStatus === 'success' && styles.targetFrameSuccess,
                (scanStatus === 'invalid' || scanStatus === 'error') && styles.targetFrameInvalid,
                scanStatus === 'expired' && styles.targetFrameExpired,
              ]}
            >
              {/* Corner Markers */}
              <View
                style={[
                  styles.cornerTopLeft,
                  scanStatus === 'success' && styles.cornerSuccess,
                  (scanStatus === 'invalid' || scanStatus === 'error') && styles.cornerInvalid,
                  scanStatus === 'expired' && styles.cornerExpired,
                ]}
              />
              <View
                style={[
                  styles.cornerTopRight,
                  scanStatus === 'success' && styles.cornerSuccess,
                  (scanStatus === 'invalid' || scanStatus === 'error') && styles.cornerInvalid,
                  scanStatus === 'expired' && styles.cornerExpired,
                ]}
              />
              <View
                style={[
                  styles.cornerBottomLeft,
                  scanStatus === 'success' && styles.cornerSuccess,
                  (scanStatus === 'invalid' || scanStatus === 'error') && styles.cornerInvalid,
                  scanStatus === 'expired' && styles.cornerExpired,
                ]}
              />
              <View
                style={[
                  styles.cornerBottomRight,
                  scanStatus === 'success' && styles.cornerSuccess,
                  (scanStatus === 'invalid' || scanStatus === 'error') && styles.cornerInvalid,
                  scanStatus === 'expired' && styles.cornerExpired,
                ]}
              />

              {/* Scanning Laser Line */}
              {showCamera && isCameraReady && !hasScanned && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{ translateY: scanLineAnim }],
                    },
                  ]}
                />
              )}

              {/* Status Indicator inside Frame */}
              {scanStatus === 'idle' && (
                <View style={styles.frameCenterTextContainer}>
                  <Text style={styles.frameCenterText}>
                    Position patient's QR code within the frame
                  </Text>
                </View>
              )}

              {scanStatus === 'verifying' && (
                <View style={styles.statusIndicatorCenter}>
                  <ActivityIndicator size="large" color="#38BDF8" />
                  <Text style={styles.verifyingText}>{t('provider.scanningAndVerifying')}</Text>
                </View>
              )}

              {scanStatus === 'success' && (
                <View style={styles.statusIndicatorCenter}>
                  <View style={styles.successCircle}>
                    <Text style={styles.successCheck}>✓</Text>
                  </View>
                  <Text style={styles.successText}>{t('provider.qrVerified')}</Text>
                </View>
              )}

              {scanStatus === 'invalid' && (
                <View style={styles.statusIndicatorCenter}>
                  <View style={styles.invalidCircle}>
                    <Text style={styles.invalidCross}>✕</Text>
                  </View>
                  <Text style={styles.invalidText}>{t('provider.invalidQRTitle')}</Text>
                </View>
              )}

              {scanStatus === 'expired' && (
                <View style={styles.statusIndicatorCenter}>
                  <View style={styles.expiredCircle}>
                    <Text style={styles.expiredExclamation}>!</Text>
                  </View>
                  <Text style={styles.expiredText}>{t('provider.expiredQRTitle')}</Text>
                </View>
              )}
            </View>
            <View style={styles.overlayDarkSide} />
          </View>
          <View style={styles.overlayDarkBottom} />
        </View>
      </View>

      {/* Bottom Control & Guidance Section */}
      <View style={styles.bottomSection}>
        {scanStatus === 'idle' && (
          <>
            <Text style={styles.instructionText}>
              {t('provider.scanInstruction')}
            </Text>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleStartScanning}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>{t('provider.startScanning')}</Text>
            </TouchableOpacity>
          </>
        )}

        {scanStatus === 'scanning' && (
          <View style={styles.scanningControlsContainer}>
            <View style={styles.scanningPromptBox}>
              <View style={[styles.scanningDot, !isCameraReady && styles.scanningDotAmber]} />
              <Text style={styles.scanningPromptText}>
                {isCameraReady
                  ? t('provider.cameraActivePrompt')
                  : t('provider.initializingCamera')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.manualEntryBtn}
              onPress={() => {
                setManualError('');
                setManualModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.manualEntryBtnText}>⌨ Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanStatus === 'invalid' && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorPanelTitle}>{t('provider.invalidQRTitle')}</Text>
            <Text style={styles.errorPanelBody}>
              {errorMessage || t('provider.invalidQRDesc')}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.scanAgainButton, styles.flex1]}
                onPress={handleStartScanning}
              >
                <Text style={styles.scanAgainText}>{t('provider.scanAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualOptionBtn, styles.flex1]}
                onPress={() => {
                  setManualError('');
                  setManualModalVisible(true);
                }}
              >
                <Text style={styles.manualOptionText}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanStatus === 'expired' && (
          <View style={[styles.errorPanel, styles.errorPanelAmber]}>
            <Text style={[styles.errorPanelTitle, styles.errorTitleAmber]}>{t('provider.expiredQRTitle')}</Text>
            <Text style={[styles.errorPanelBody, styles.errorBodyAmber]}>
              {errorMessage || t('provider.expiredQRDesc')}
            </Text>
            <TouchableOpacity
              style={[styles.scanAgainButton, styles.scanAgainAmber]}
              onPress={handleStartScanning}
            >
              <Text style={styles.scanAgainText}>{t('provider.scanAgain')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanStatus === 'error' && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorPanelTitle}>{t('provider.authErrorTitle')}</Text>
            <Text style={styles.errorPanelBody}>{errorMessage}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.scanAgainButton, styles.flex1]}
                onPress={handleStartScanning}
              >
                <Text style={styles.scanAgainText}>{t('provider.scanAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualOptionBtn, styles.flex1]}
                onPress={() => {
                  setManualError('');
                  setManualModalVisible(true);
                }}
              >
                <Text style={styles.manualOptionText}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanStatus === 'success' && (
          <View style={styles.successPanel}>
            <Text style={styles.successPanelTitle}>{t('provider.accessAuthorized')}</Text>
            <Text style={styles.successPanelSubtitle}>{t('provider.redirecting')}</Text>
          </View>
        )}

        {/* Footer Audit Disclaimer */}
        <Text style={styles.bottomAuditNote}>
          {t('provider.auditNote')}
        </Text>
      </View>

      {/* Manual Token Entry Modal */}
      <Modal
        visible={manualModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setManualModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Patient Access Token</Text>
            <Text style={styles.modalSubtitle}>
              Type the token shown below the QR code on the patient's HealthNest card.
            </Text>

            <TextInput
              style={styles.tokenInput}
              value={manualTokenInput}
              onChangeText={(text) => {
                setManualTokenInput(text);
                if (manualError) setManualError('');
              }}
              placeholder="e.g. HN-2026-XXXX-XXXX"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />

            {manualError ? (
              <Text style={styles.modalErrorText}>{manualError}</Text>
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setManualModalVisible(false);
                  setManualError('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalVerifyBtn}
                onPress={handleManualSubmit}
              >
                <Text style={styles.modalVerifyText}>Verify Patient</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  flashActive: {
    backgroundColor: '#F59E0B',
  },
  flashIcon: {
    fontSize: 18,
  },

  // ── Scanner area ──────────────────────────────────────────────
  scannerWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  cameraFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  cameraLoadingText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  cameraErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 2,
  },
  cameraErrorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cameraErrorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cameraErrorMessage: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  retryCameraBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryCameraBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cameraPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cameraPlaceholderText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  grantPermissionBtn: {
    marginTop: 16,
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  grantPermissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Overlay ──────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayDarkTop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  overlayDarkSide: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  overlayDarkBottom: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },

  // ── Target frame ─────────────────────────────────────────────
  targetFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  targetFrameSuccess: {
    borderColor: '#22C55E',
  },
  targetFrameInvalid: {
    borderColor: '#EF4444',
  },
  targetFrameExpired: {
    borderColor: '#F59E0B',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#0284C7',
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#0284C7',
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#0284C7',
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#0284C7',
    borderBottomRightRadius: 18,
  },
  cornerSuccess: {
    borderColor: '#22C55E',
  },
  cornerInvalid: {
    borderColor: '#EF4444',
  },
  cornerExpired: {
    borderColor: '#F59E0B',
  },
  scanLine: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  frameCenterTextContainer: {
    paddingHorizontal: 24,
  },
  frameCenterText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  statusIndicatorCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  verifyingText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  successCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  successCheck: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  successText: {
    color: '#22C55E',
    fontSize: 15,
    fontWeight: '700',
  },
  invalidCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  invalidCross: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  invalidText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  expiredCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  expiredExclamation: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  expiredText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Bottom section ───────────────────────────────────────────
  bottomSection: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  instructionText: {
    color: '#CBD5E1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryActionButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scanningControlsContainer: {
    gap: 8,
  },
  scanningPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  scanningDotAmber: {
    backgroundColor: '#F59E0B',
  },
  scanningPromptText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  manualEntryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualEntryBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  flex1: {
    flex: 1,
  },
  errorPanel: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  errorPanelTitle: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  errorPanelBody: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorPanelAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  errorTitleAmber: {
    color: '#F59E0B',
  },
  errorBodyAmber: {
    color: '#CBD5E1',
  },
  scanAgainButton: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanAgainAmber: {
    backgroundColor: '#78350F',
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  manualOptionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualOptionText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  successPanel: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22C55E',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  successPanelTitle: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  successPanelSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  bottomAuditNote: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },

  // ── Manual Modal ─────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  tokenInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#F8FAFC',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  modalVerifyBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalVerifyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
