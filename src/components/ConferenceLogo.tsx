import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Text as SvgText, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface ConferenceLogoProps {
  width?: number;
  height?: number;
}

/**
 * Conference logo banner component with elegant typography and styling.
 * Matches the 2027 International Nursing Conference branding.
 */
export const ConferenceLogo: React.FC<ConferenceLogoProps> = ({
  width = 320,
  height = 96,
}) => {
  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox="0 0 360 108" fill="none">
        <Defs>
          <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="100%" stopColor="#7C3AED" />
          </LinearGradient>
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
        </Defs>

        {/* Embellished badge / crest representation */}
        <Rect x="16" y="22" width="64" height="64" rx="16" fill="url(#logoGrad)" />
        <Circle cx="48" cy="54" r="20" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9" />
        <SvgText
          x="48"
          y="59"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="800"
          fontFamily="System"
        >
          CMU
        </SvgText>

        {/* Text header typography */}
        <SvgText
          x="94"
          y="42"
          fill="#0F172A"
          fontSize="18"
          fontWeight="800"
          fontFamily="System"
          letterSpacing="0.2"
        >
          2027 INC
        </SvgText>

        <SvgText
          x="94"
          y="62"
          fill="#4F46E5"
          fontSize="12.5"
          fontWeight="700"
          fontFamily="System"
        >
          FACULTY OF NURSING
        </SvgText>

        <SvgText
          x="94"
          y="78"
          fill="#64748B"
          fontSize="11"
          fontWeight="600"
          fontFamily="System"
        >
          CHIANG MAI UNIVERSITY
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
});
