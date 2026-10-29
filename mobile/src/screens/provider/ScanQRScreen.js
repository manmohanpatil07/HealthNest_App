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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { providerService } from '../../services/providerService';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = 260;

export default function ScanQRScreen({ navigation }) {
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'scanning' | 'verifying' | 'success' | 'invalid' | 'expired' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Scanline animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanAnimRef = useRef(null);

  useEffect(() => {
    if (isScanningActive && !hasScanned && cameraReady) {
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
  }, [isScanningActive, hasScanned, cameraReady]);

  const handleStartScanning = async () => {
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
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required to scan the patient\'s QR Health Card. Please enable camera access in your device settings.'
        );
        return;
      }
    }
    setCameraReady(false);
    setScanStatus('scanning');
    setHasScanned(false);
    setIsScanningActive(true);
    setErrorMessage('');
  };

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  const handleBarCodeScanned = useCallback(async ({ data }) => {
    // Prevent duplicate scans while processing
    if (hasScanned || loading) return;

    setHasScanned(true);
    setIsScanningActive(false);
    setScanStatus('verifying');
    setLoading(true);

    try {
      // Scanned data is expected to be an access token string (e.g. HN-2026-XXXX-XXXX) or JSON containing access_token
      let rawToken = data ? String(data).trim() : '';

      if (rawToken.startsWith('{') && rawToken.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawToken);
          rawToken = parsed.access_token || parsed.token || rawToken;
        } catch (e) {
          // not json, use raw string
        }
      }

      if (!rawToken) {
        setScanStatus('invalid');
        setErrorMessage('This does not appear to be a valid HealthNest QR code. Please try again.');
        setLoading(false);
        return;
      }

      const res = await providerService.scanQR(rawToken);

      if (res && res.success) {
        setScanStatus('success');
        setLoading(false);
        // Short delay to display green verification success state before navigating
        setTimeout(() => {
          navigation.navigate('PatientDetails', {
            patient: res.patient,
            healthRecords: res.healthRecords,
            documents: res.documents,
            vaccinations: res.vaccinations,
            accessInfo: res.accessInfo,
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
  }, [hasScanned, loading, navigation]);

  const handleResetScan = () => {
    setHasScanned(false);
    setScanStatus('idle');
    setErrorMessage('');
    setIsScanningActive(false);
    setCameraReady(false);
  };

  // Determine if the camera component should be rendered
  const showCamera = permission?.granted && isScanningActive;

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
        <TouchableOpacity
          style={[styles.flashButton, isTorchOn ? styles.flashActive : styles.flashInactive]}
          onPress={() => setIsTorchOn(!isTorchOn)}
        >
          <Text style={styles.flashIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Camera / Scanner Frame Container */}
      <View style={styles.scannerWrapper}>
        {/* Layer 1 (bottom): Camera preview OR placeholder — fills the entire scanner area */}
        {showCamera ? (
          <CameraView
            style={styles.cameraFill}
            facing="back"
            enableTorch={isTorchOn}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
            onCameraReady={handleCameraReady}
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderIcon}>📷</Text>
            <Text style={styles.cameraPlaceholderText}>
              {permission?.granted
                ? 'Camera ready'
                : 'Camera permission required'}
            </Text>
          </View>
        )}

        {/* Layer 2 (top): Transparent overlay with viewfinder frame — sits above camera */}
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Semi-transparent darkened border around the cutout */}
          {/* Top dark region */}
          <View style={styles.overlayDarkTop} />
          {/* Middle row: left dark | transparent cutout | right dark */}
          <View style={styles.overlayMiddleRow}>
            <View style={styles.overlayDarkSide} />
            {/* The transparent viewfinder cutout */}
            <View
              style={[
                styles.targetFrame,
                scanStatus === 'success' && styles.targetFrameSuccess,
                (scanStatus === 'invalid' || scanStatus === 'error') && styles.targetFrameInvalid,
                scanStatus === 'expired' && styles.targetFrameExpired,
              ]}
            >
              {/* 4 Corner Markers */}
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

              {/* Scanning Line Animation */}
              {isScanningActive && !hasScanned && cameraReady && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{ translateY: scanLineAnim }],
                    },
                  ]}
                />
              )}

              {/* Status indicator inside frame */}
              {scanStatus === 'idle' && (
                <View style={styles.frameCenterTextContainer}>
                  <Text style={styles.frameCenterText}>
                    Position patient's QR code within the frame
                  </Text>
                </View>
              )}

              {/* Camera loading indicator (camera mounted but not yet ready) */}
              {showCamera && !cameraReady && scanStatus === 'scanning' && (
                <View style={styles.statusIndicatorCenter}>
                  <ActivityIndicator size="large" color="#38BDF8" />
                  <Text style={styles.verifyingText}>{t('provider.initializingCamera')}</Text>
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
          {/* Bottom dark region */}
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
          <View style={styles.scanningPromptBox}>
            {cameraReady ? (
              <>
                <View style={styles.scanningDot} />
                <Text style={styles.scanningPromptText}>{t('provider.cameraActivePrompt')}</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color="#0D9488" style={{ marginRight: 8 }} />
                <Text style={styles.scanningPromptText}>{t('provider.initializingCamera')}</Text>
              </>
            )}
          </View>
        )}

        {scanStatus === 'invalid' && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorPanelTitle}>{t('provider.invalidQRTitle')}</Text>
            <Text style={styles.errorPanelBody}>
              {errorMessage || t('provider.invalidQRDesc')}
            </Text>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleStartScanning}
            >
              <Text style={styles.scanAgainText}>{t('provider.scanAgain')}</Text>
            </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleStartScanning}
            >
              <Text style={styles.scanAgainText}>{t('provider.scanAgain')}</Text>
            </TouchableOpacity>
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
    overflow: 'hidden',
  },
  // Camera fills the entire scanner area (positioned absolutely)
  cameraFill: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cameraPlaceholderText: {
    color: '#94A3B8',
    fontSize: 14,
  },

  // ── Overlay (sits on top of camera, provides darkened border + transparent cutout) ──
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

  // ── Target frame (the transparent cutout where the camera shows through) ──
  targetFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    // transparent background — lets the camera show through
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
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  frameCenterTextContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  frameCenterText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  statusIndicatorCenter: {
    alignItems: 'center',
  },
  verifyingText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  successCheck: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  successText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '800',
  },
  invalidCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  invalidCross: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  invalidText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  expiredCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  expiredExclamation: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  expiredText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
  },

  // ── Bottom section ────────────────────────────────────────────
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 16,
    alignItems: 'center',
  },
  instructionText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  primaryActionButton: {
    width: '100%',
    backgroundColor: '#0D9488',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scanningPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  scanningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  scanningPromptText: {
    color: '#CCFBF1',
    fontSize: 14,
    fontWeight: '600',
  },
  errorPanel: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorPanelAmber: {
    borderColor: '#F59E0B',
  },
  errorPanelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 6,
  },
  errorTitleAmber: {
    color: '#F59E0B',
  },
  errorPanelBody: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  errorBodyAmber: {
    color: '#FEF3C7',
  },
  scanAgainButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  scanAgainAmber: {
    backgroundColor: '#F59E0B',
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  successPanel: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  successPanelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#22C55E',
    marginBottom: 4,
  },
  successPanelSubtitle: {
    fontSize: 13,
    color: '#86EFAC',
  },
  bottomAuditNote: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
