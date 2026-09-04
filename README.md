# 2027 International Nursing Conference — React Native App

This repository contains the React Native application for the **2027 International Nursing Conference** "Add to Calendar" experience with native iOS Apple Calendar integration via **EventKit / EventKitUI**, dynamic **Google Calendar** and **Microsoft Outlook** integrations, and Android support.

---

## 1. Event Information

- **Title:** 2027 International Nursing Conference
- **Theme:** Shared Vision, Shared Mission: Illuminating the Future of Nursing for a Sustainable World
- **Dates:** 11–12 November 2027
- **Event type:** All-day event
- **Location:** Chiang Mai, Thailand
- **Organizer:** Faculty of Nursing, Chiang Mai University
- **Website:** [https://www.nurse.cmu.ac.th/](https://www.nurse.cmu.ac.th/)

---

## 2. Project Architecture

```text
├── App.tsx                                # Root entry point
├── package.json                           # Dependencies & scripts
├── tsconfig.json                          # TypeScript configuration
├── ios/
│   ├── AppleCalendarModule.swift          # Native EventKit / EventKitUI Swift module
│   ├── AppleCalendarModule.m              # React Native Objective-C bridge registration
│   └── Info.plist                         # NSCalendarsWriteOnlyAccessUsageDescription & permissions
├── src/
│   ├── constants/
│   │   └── conferenceEvent.ts             # Single source of truth event configuration
│   ├── services/
│   │   ├── calendarService.ts             # Dynamic Google & Outlook URLs, Linking & error handling
│   │   └── analyticsService.ts            # Safe analytics dispatcher (calendar_*_click)
│   ├── native/
│   │   └── AppleCalendar.ts               # TypeScript bridge wrapper for AppleCalendarModule
│   ├── components/
│   │   ├── icons/
│   │   │   └── CalendarIcons.tsx          # Vector SVG icons (Google, Outlook, Apple, Link, Pin, Date)
│   │   ├── ConferenceLogo.tsx             # Vector Conference Logo banner
│   │   ├── CalendarButton.tsx             # Reusable interactive calendar button
│   │   └── EventInfo.tsx                  # Side-by-side [Dates | Location] info card
│   └── screens/
│       └── ConferenceCalendarScreen.tsx   # Complete landing page UI screen
└── tests/
    └── calendarService.test.ts            # Unit tests for URL generation & date normalization
```

---

## 3. All-Day Date Handling & Normalization

The conference runs **11 November 2027 through 12 November 2027** as an **all-day event**.

To prevent timezone conversion bugs (such as 10 Nov or 13 Nov appearing depending on the user's timezone):

1. **Google Calendar**:
   - Uses `dates=20271111/20271113`.
   - Google Calendar treats the end date as an exclusive boundary for all-day events (`YYYYMMDD`), presenting the event spanning **11–12 November 2027**.
2. **Microsoft Outlook**:
   - Uses `startdt=2027-11-11T00:00:00`, `enddt=2027-11-13T00:00:00`, and `allday=true`.
   - Outlook interprets the 2-day all-day span with the midnight boundary on the 13th as **11–12 November 2027**.
3. **Apple Calendar (iOS EventKit & EventKitUI)**:
   - Sets `event.isAllDay = true`.
   - Start date is configured at `2027-11-11 00:00:00` in the user's local calendar.
   - End date boundary is configured at `2027-11-13 00:00:00`.
   - Presented via Apple's native `EKEventEditViewController`, this visually renders as **Nov 11 – Nov 12, 2027**, allowing the user to review the pre-populated details and tap **Add**.
4. **No Legacy .ics Files**:
   - All Blob creation, `.ics` string generation, and file downloads have been completely removed.

---

## 4. Native iOS Apple Calendar Integration

### Swift Implementation (`ios/AppleCalendarModule.swift`)
- Uses `EKEventStore` and `EKEventEditViewController`.
- Requests least-privilege write access using `requestWriteOnlyAccessToEvents` (iOS 17+) with fallback to `requestAccess(to: .event)` on earlier iOS versions.
- Adopts `EKEventEditViewDelegate` to dismiss the native controller and resolve the React Native promise when the user taps **Add** (`.saved`) or **Cancel** (`.canceled`).

### Permissions (`ios/Info.plist`)
```xml
<key>NSCalendarsWriteOnlyAccessUsageDescription</key>
<string>Calendar access is used to add the 2027 International Nursing Conference to your calendar.</string>
<key>NSCalendarsUsageDescription</key>
<string>Calendar access is used to add the 2027 International Nursing Conference to your calendar.</string>
```

---

## 5. Platform-Aware Behavior

- **iOS:**
  - Displays Google Calendar, Microsoft Outlook, and Apple Calendar buttons.
  - Apple Calendar opens Apple's native `EKEventEditViewController`.
- **Android:**
  - `Platform.OS === 'ios'` guard hides the Apple Calendar button on Android or directs the user to Google Calendar / device calendar.
  - No Apple EventKit code is invoked on Android.

---

## 6. Installation & Execution

```bash
# Install dependencies
npm install

# Install iOS CocoaPods
cd ios && pod install && cd ..

# Run iOS
npx react-native run-ios

# Run Android
npx react-native run-android
```
