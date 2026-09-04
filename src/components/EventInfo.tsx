import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalendarDaysIcon, LocationPinIcon } from './icons/CalendarIcons';

export interface EventInfoProps {
  dates: string;
  location: string;
}

/**
 * EventInfo displays the key event information in a side-by-side card layout:
 * [ CONFERENCE DATES | LOCATION ]
 */
export const EventInfo: React.FC<EventInfoProps> = ({ dates, location }) => {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <View style={styles.headerRow}>
          <CalendarDaysIcon size={13} color="#6366F1" />
          <Text style={styles.label}>CONFERENCE DATES</Text>
        </View>
        <Text style={styles.value}>{dates}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.item}>
        <View style={styles.headerRow}>
          <LocationPinIcon size={13} color="#EA580C" />
          <Text style={styles.label}>LOCATION</Text>
        </View>
        <Text style={styles.value}>{location}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
});
