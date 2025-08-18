import { Text } from '@/components/ui/text';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BORDER_RADIUS, CORNERS, FONT_SIZE } from '@/theme/globals';
import { Loader2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  View,
  ViewStyle,
} from 'react-native';

// Types
type SpinnerSize = 'default' | 'sm' | 'lg' | 'icon';
export type SpinnerVariant = 'default' | 'cirlce' | 'dots' | 'pulse' | 'bars';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  showLabel?: boolean;
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  speed?: 'slow' | 'normal' | 'fast';
}

interface LoadingOverlayProps extends SpinnerProps {
  visible: boolean;
  backdrop?: boolean;
  backdropColor?: string;
  backdropOpacity?: number;
  onRequestClose?: () => void;
}

interface SpinnerConfig {
  size: number;
  iconSize: number;
  fontSize: number;
  gap: number;
  thickness: number;
}

// Configuration
const sizeConfig: Record<SpinnerSize, SpinnerConfig> = {
  sm: { size: 16, iconSize: 16, fontSize: 12, gap: 6, thickness: 2 },
  default: {
    size: 24,
    iconSize: 24,
    fontSize: FONT_SIZE,
    gap: 8,
    thickness: 2,
  },
  lg: { size: 32, iconSize: 32, fontSize: 16, gap: 10, thickness: 3 },
  icon: { size: 24, iconSize: 24, fontSize: FONT_SIZE, gap: 8, thickness: 2 },
};

const speedConfig = {
  slow: 1500,
  normal: 1000,
  fast: 500,
};

// Main Spinner Component
export function Spinner({
  size = 'default',
  variant = 'default',
  label,
  showLabel = false,
  style,
  color,
  speed = 'normal',
}: SpinnerProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotsAnim = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;
  const barsAnim = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  // Theme colors
  const primaryColor = useThemeColor({}, 'text');
  const textColor = useThemeColor({}, 'text');

  const config = sizeConfig[size];
  const spinnerColor = color || primaryColor;
  const animationDuration = speedConfig[speed];

  // Rotation animation
  useEffect(() => {
    if (variant === 'cirlce') {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [rotateAnim, variant, animationDuration]);

  // Pulse animation
  useEffect(() => {
    if (variant === 'pulse') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [pulseAnim, variant, animationDuration]);

  // Dots animation
  useEffect(() => {
    if (variant === 'dots') {
      const createDotAnimation = (animValue: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: animationDuration / 3,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: animationDuration / 3,
              useNativeDriver: true,
            }),
          ])
        );

      const animations = dotsAnim.map((anim, index) =>
        createDotAnimation(anim, index * (animationDuration / 6))
      );

      animations.forEach((anim) => anim.start());
      return () => animations.forEach((anim) => anim.stop());
    }
  }, [dotsAnim, variant, animationDuration]);

  // Bars animation
  useEffect(() => {
    if (variant === 'bars') {
      const createBarAnimation = (animValue: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: animationDuration / 4,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: animationDuration / 4,
              useNativeDriver: true,
            }),
          ])
        );

      const animations = barsAnim.map((anim, index) =>
        createBarAnimation(anim, index * (animationDuration / 8))
      );

      animations.forEach((anim) => anim.start());
      return () => animations.forEach((anim) => anim.stop());
    }
  }, [barsAnim, variant, animationDuration]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderSpinner = () => {
    switch (variant) {
      case 'default':
        return (
          <ActivityIndicator
            size={config.size}
            color={spinnerColor}
            className="self-center"
          />
        );

      case 'cirlce':
        return (
          <Animated.View
            style={[
              {
                width: config.size,
                height: config.size,
                transform: [{ rotate: spin }],
              },
            ]}
            className="items-center justify-center"
          >
            <Loader2 size={config.iconSize} color={spinnerColor} />
          </Animated.View>
        );

      case 'pulse':
        return (
          <Animated.View
            style={[
              {
                width: config.size,
                height: config.size,
                backgroundColor: spinnerColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
            className="rounded-full"
          />
        );

      case 'dots':
        return (
          <View style={{ gap: config.size / 4 }} className="flex-row items-center justify-center">
            {dotsAnim.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  {
                    width: config.size / 3,
                    height: config.size / 3,
                    backgroundColor: spinnerColor,
                    opacity: anim,
                  },
                ]}
                className="rounded-full"
              />
            ))}
          </View>
        );

      case 'bars':
        return (
          <View style={{ gap: config.size / 6 }} className="flex-row items-center justify-center">
            {barsAnim.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  {
                    width: config.size / 6,
                    height: config.size,
                    backgroundColor: spinnerColor,
                    opacity: anim,
                  },
                ]}
                className="rounded-lg"
              />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    gap: config.gap,
  };

  return (
    <View style={[containerStyle, style]}>
      {renderSpinner()}
      {(showLabel || label) && (
        <Text
          style={{
              color: textColor,
              fontSize: config.fontSize,
            }}
          className="text-center font-medium"
        >
          {label || 'Loading...'}
        </Text>
      )}
    </View>
  );
}

// Loading Overlay Component
export function LoadingOverlay({
  visible,
  backdrop = true,
  backdropColor,
  backdropOpacity = 0.5,
  onRequestClose,
  ...spinnerProps
}: LoadingOverlayProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, overlayOpacity]);

  if (!visible) return null;

  const defaultBackdropColor =
    backdropColor ||
    `${backgroundColor}${Math.round(backdropOpacity * 255)
      .toString(16)
      .padStart(2, '0')}`;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: backdrop ? defaultBackdropColor : 'transparent',
          opacity: overlayOpacity,
        },
      ]}
      className="absolute inset-0 items-center justify-center z-[9999]"
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={{ backgroundColor: cardColor }} className="p-15 rounded-lg">
        <Spinner {...spinnerProps} />
      </View>
    </Animated.View>
  );
}

// Inline Loader Component (for buttons, etc.)
export function InlineLoader({
  size = 'sm',
  variant = 'default',
  color,
}: Omit<SpinnerProps, 'label' | 'showLabel'>) {
  return (
    <Spinner
      size={size}
      variant={variant}
      color={color}
      className="min-h-0 min-w-0"
    />
  );
}

// Button Spinner Component - optimized for button usage
export function ButtonSpinner({
  size = 'sm',
  variant = 'default',
  color,
}: Omit<SpinnerProps, 'label' | 'showLabel'>) {
  const primaryForegroundColor = useThemeColor({}, 'primaryForeground');

  return (
    <Spinner
      size={size}
      variant={variant}
      color={color || primaryForegroundColor}
      className="min-h-0 min-w-0"
    />
  );
}
