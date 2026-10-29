import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SERVER_ROOT_URL } from '../services/api';

// Category config: icon + label + colors — matches UI_INSTRUCTIONS.md §24
const CATEGORY_CONFIG = {
  'Blood Test':    { icon: '🩸', bg: '#FFF0F0', border: '#FCA5A5', badge: '#EF4444' },
  'Prescription':  { icon: '💊', bg: '#F0FFF4', border: '#86EFAC', badge: '#22C55E' },
  'Consultation':  { icon: '👨‍⚕️', bg: '#EFF6FF', border: '#93C5FD', badge: '#3B82F6' },
  'Radiology':     { icon: '🔬', bg: '#FDF4FF', border: '#D8B4FE', badge: '#A855F7' },
  'Other':         { icon: '📋', bg: '#F8FAFC', border: '#CBD5E1', badge: '#64748B' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * HealthRecordCard
 * Props:
 *  - record: { record_id, record_type, title, description, record_date, attachments }
 *  - onDelete: () => void
 *  - onViewAttachment: (attachment) => void
 *  - onPress: () => void
 */
export default function HealthRecordCard({ record, onDelete, onViewAttachment, onPress }) {
  const config = CATEGORY_CONFIG[record.record_type] || CATEGORY_CONFIG['Other'];
  const firstAttachment = record.attachments && record.attachments.length > 0 ? record.attachments[0] : null;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
    >
      <View style={styles.headerRow}>
        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: config.badge + '20', borderColor: config.badge }]}>
          <Text style={styles.badgeIcon}>{config.icon}</Text>
          <Text style={[styles.badgeLabel, { color: config.badge }]}>{record.record_type}</Text>
        </View>

        {/* Delete button (if user is owner and onDelete supplied) */}
        {onDelete ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            accessibilityLabel={`Delete ${record.title}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteBtnText}>🗑</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>{record.title}</Text>

      {/* Description */}
      {!!record.description && (
        <Text style={styles.description} numberOfLines={2}>{record.description}</Text>
      )}

      {/* Attachment Strip if present */}
      {firstAttachment ? (
        <TouchableOpacity
          style={styles.attachmentStrip}
          onPress={() => onViewAttachment && onViewAttachment(firstAttachment)}
          activeOpacity={0.7}
        >
          {firstAttachment.file_type && firstAttachment.file_type.startsWith('image/') ? (
            <Image
              source={{
                uri: firstAttachment.file_url.startsWith('http')
                  ? firstAttachment.file_url
                  : `${SERVER_ROOT_URL}${firstAttachment.file_url}`,
              }}
              style={styles.attachmentThumbnail}
            />
          ) : (
            <View style={styles.attachmentFileIcon}>
              <Text style={{ fontSize: 18 }}>📄</Text>
            </View>
          )}
          <View style={styles.attachmentInfo}>
            <Text style={styles.attachmentName} numberOfLines={1}>
              📎 {firstAttachment.file_name || 'Medical Document'}
            </Text>
            <Text style={styles.attachmentActionHint}>Tap to view proof</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Date */}
      <View style={styles.dateRow}>
        <Text style={styles.dateIcon}>📅</Text>
        <Text style={styles.date}>{formatDate(record.record_date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 13,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 8,
  },
  attachmentStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  attachmentFileIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 10,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  attachmentActionHint: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dateIcon: {
    fontSize: 11,
  },
  date: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
