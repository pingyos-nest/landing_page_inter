import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { conferenceEvent } from '../constants/conferenceEvent';
import { calendarService } from '../services/calendarService';
import { ConferenceLogo } from '../components/ConferenceLogo';
import { EventInfo } from '../components/EventInfo';
import { CalendarButton } from '../components/CalendarButton';
import {
  GoogleCalendarIcon,
  OutlookIcon,
  AppleCalendarIcon,
  ExternalLinkIcon,
} from '../components/icons/CalendarIcons';

/**
 * ConferenceCalendarScreen
 * Renders the 2027 International Nursing Conference "Add to Calendar" landing interface.
 */
export const ConferenceCalendarScreen: React.FC = () => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleGooglePress = async () => {
    try {
      setLoadingAction('google');
      await calendarService.addToGoogleCalendar(conferenceEvent);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOutlookPress = async () => {
    try {
      setLoadingAction('outlook');
      await calendarService.addToOutlookCalendar(conferenceEvent);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApplePress = async () => {
    try {
      setLoadingAction('apple');
      await calendarService.addToAppleCalendar(conferenceEvent);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDetailsPress = async () => {
    try {
      setLoadingAction('details');
      await calendarService.openConferenceWebsite(conferenceEvent);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Conference Logo */}
          <ConferenceLogo />

          {/* Title */}
          <Text style={styles.title}>{conferenceEvent.title}</Text>

          {/* Theme Tagline */}
          <Text style={styles.theme}>{conferenceEvent.theme}</Text>

          {/* Prominent Key Info: Dates & Location */}
          <EventInfo
            dates={conferenceEvent.formattedDateRange}
            location={conferenceEvent.location}
          />

          {/* Calendar Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add to Calendar</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred calendar service
            </Text>
          </View>

          {/* Calendar Actions */}
          <View style={styles.buttonList}>
            {/* Google Calendar */}
            <CalendarButton
              id="googleCalendarBtn"
              title="Google Calendar"
              subtitle="Add directly to Google account"
              icon={<GoogleCalendarIcon size={22} />}
              iconBgColor="#E8F0FE"
              onPress={handleGooglePress}
              isLoading={loadingAction === 'google'}
            />

            {/* Microsoft Outlook */}
            <CalendarButton
              id="outlookCalendarBtn"
              title="Microsoft Outlook"
              subtitle="Outlook & Microsoft 365"
              icon={<OutlookIcon size={22} />}
              iconBgColor="#EFF6FC"
              onPress={handleOutlookPress}
              isLoading={loadingAction === 'outlook'}
            />

            {/* Apple Calendar: Display on iOS, or hide/adapt on Android */}
            {Platform.OS === 'ios' ? (
              <CalendarButton
                id="appleCalendarBtn"
                title="Apple Calendar"
                subtitle="Add to Apple Calendar"
                icon={<AppleCalendarIcon size={22} />}
                iconBgColor="#F1F5F9"
                onPress={handleApplePress}
                isLoading={loadingAction === 'apple'}
              />
            ) : null}
          </View>

          {/* Further Details Button */}
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Further details will be announced soon. Opens official conference website."
            testID="furtherDetailsBtn"
            activeOpacity={0.8}
            style={styles.detailsButton}
            onPress={handleDetailsPress}
          >
            <Text style={styles.detailsText}>
              Further details will be announced soon
            </Text>
            <ExternalLinkIcon size={14} color="#6366F1" />
          </TouchableOpacity>

          {/* Organizer Footer */}
          <View style={styles.organizerContainer}>
            <Text style={styles.organizerPrefix}>Organized by the</Text>
            <Text style={styles.organizerName}>
              {conferenceEvent.organizer}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  theme: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
  },
  buttonList: {
    width: '100%',
    marginBottom: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 8,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  organizerContainer: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  organizerPrefix: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  organizerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
});
