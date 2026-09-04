import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { ChevronRightIcon } from './icons/CalendarIcons';

export interface CalendarButtonProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  onPress: () => Promise<void> | void;
  isLoading?: boolean;
  style?: ViewStyle;
}

/**
 * CalendarButton renders a premium interactive card button matching the web UI aesthetics:
 * custom icon wrapper with soft tint, bold title, secondary subtitle, and animated chevron.
 */
export const CalendarButton: React.FC<CalendarButtonProps> = ({
  id,
  title,
  subtitle,
  icon,
  iconBgColor = '#EEF2FF',
  onPress,
  isLoading = false,
  style,
}) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      testID={id}
      activeOpacity={0.7}
      style={[styles.buttonCard, style]}
      onPress={onPress}
      disabled={isLoading}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>

      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.arrowBox}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : (
          <ChevronRightIcon size={16} color="#94A3B8" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  arrowBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
