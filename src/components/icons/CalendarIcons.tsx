import React from 'react';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Google Calendar brand icon
 */
export const GoogleCalendarIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Clean, multi-color modern Google Calendar icon representation */}
    <Rect x="3" y="4" width="18" height="18" rx="3" fill="#4285F4" />
    <Rect x="3" y="4" width="18" height="6" rx="3" fill="#1A73E8" />
    <Rect x="7" y="2" width="2" height="4" rx="1" fill="#EA4335" />
    <Rect x="15" y="2" width="2" height="4" rx="1" fill="#EA4335" />
    {/* Inner calendar grid / date number representation */}
    <Rect x="6" y="12" width="12" height="7" rx="1.5" fill="#FFFFFF" />
    <Path
      d="M9 14.5H10.5V17.5M13.5 14.5H15V17.5"
      stroke="#1A73E8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Microsoft Outlook brand icon
 */
export const OutlookIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="16" rx="3" fill="#0078D4" />
    <Path
      d="M3 8L12 13.5L21 8"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x="4" y="11" width="7" height="8" rx="1.5" fill="#106EBE" />
    <Circle cx="7.5" cy="15" r="2" stroke="#FFFFFF" strokeWidth="1.5" />
  </Svg>
);

/**
 * Apple Calendar icon
 */
export const AppleCalendarIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="4" fill="#FAFAFA" stroke="#E2E8F0" strokeWidth="1.5" />
    <Path
      d="M3 7C3 4.79086 4.79086 3 7 3H17C19.2091 3 21 4.79086 21 7V8H3V7Z"
      fill="#FF3B30"
    />
    <Circle cx="8" cy="5.5" r="0.8" fill="#FFFFFF" />
    <Circle cx="16" cy="5.5" r="0.8" fill="#FFFFFF" />
    {/* Text indicator for Apple Calendar '11' */}
    <Path
      d="M9.5 12V17M14.5 12V17"
      stroke="#1E293B"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Chevron Right icon
 */
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 16, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="9 18 15 12 9 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * External Link icon
 */
export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 15, color = '#6366F1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="15 3 21 3 21 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="10"
      y1="14"
      x2="21"
      y2="3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Location Pin Icon
 */
export const LocationPinIcon: React.FC<IconProps> = ({ size = 14, color = '#EA580C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
  </Svg>
);

/**
 * Calendar Days Icon
 */
export const CalendarDaysIcon: React.FC<IconProps> = ({ size = 14, color = '#7C3AED' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="3"
      stroke={color}
      strokeWidth="2"
    />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
  </Svg>
);
