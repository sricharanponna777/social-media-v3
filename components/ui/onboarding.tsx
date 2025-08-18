import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  image?: React.ReactNode;
  icon?: React.ReactNode;
  backgroundColor?: string;
}

export interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  showProgress?: boolean;
  swipeEnabled?: boolean;
  primaryButtonText?: string;
  skipButtonText?: string;
  nextButtonText?: string;
  backButtonText?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

// Enhanced Onboarding Step Component for complex layouts
interface OnboardingStepContentProps {
  step: OnboardingStep;
  isActive: boolean;
  children?: React.ReactNode;
}

export function Onboarding({
  steps,
  onComplete,
  onSkip,
  showSkip = true,
  showProgress = true,
  swipeEnabled = true,
  primaryButtonText = 'Get Started',
  skipButtonText = 'Skip',
  nextButtonText = 'Next',
  backButtonText = 'Back',
  style,
  children,
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const translateX = useSharedValue(0);

  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'mutedForeground');

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * screenWidth,
        animated: true,
      });
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: prevStep * screenWidth,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  // Modern gesture handling with Gesture API
  const panGesture = Gesture.Pan()
    .enabled(swipeEnabled)
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const shouldSwipe =
        Math.abs(translationX) > screenWidth * 0.3 || Math.abs(velocityX) > 500;

      if (shouldSwipe) {
        if (translationX > 0 && !isFirstStep) {
          // Swipe right - go back
          runOnJS(handleBack)();
        } else if (translationX < 0 && !isLastStep) {
          // Swipe left - go next
          runOnJS(handleNext)();
        }
      }

      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const renderProgressDots = () => {
    if (!showProgress) return null;

    return (
      <View className="flex-row justify-center items-center py-5">
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              {
                backgroundColor:
                  index === currentStep ? primaryColor : mutedColor,
                opacity: index === currentStep ? 1 : 0.3,
              },
            ]}
            className="w-2 h-2 rounded-full mx-1"
          />
        ))}
      </View>
    );
  };

  const renderStep = (step: OnboardingStep, index: number) => {
    const isActive = index === currentStep;

    return (
      <Animated.View
        key={step.id}
        style={[
          { backgroundColor: step.backgroundColor || backgroundColor },
          { opacity: isActive ? 1 : 0.8 },
        ]}
        className="w-screen flex-1 justify-center items-center px-6"
      >
        <View className="flex-1 justify-center items-center max-w-md">
          {step.image && (
            <View className="flex-1 justify-center items-center mb-10 min-h-[200px]">{step.image}</View>
          )}

          {step.icon && !step.image && (
            <View className="flex-1 justify-center items-center mb-10 min-h-[200px]">{step.icon}</View>
          )}

          <View className="items-center px-5 mb-10">
            <Text variant='title' className="text-center mb-4 px-5">
              {step.title}
            </Text>
            <Text variant='body' className="text-center leading-6 px-5">
              {step.description}
            </Text>
          </View>

          {children && <View className="items-center px-5 mt-5">{children}</View>}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[{ backgroundColor }, style]} className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle} className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={swipeEnabled}
            onMomentumScrollEnd={(event) => {
              const newStep = Math.round(
                event.nativeEvent.contentOffset.x / screenWidth
              );
              setCurrentStep(newStep);
            }}
          >
            {steps.map((step, index) => renderStep(step, index))}
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Progress Dots */}
      {renderProgressDots()}

      {/* Skip Button */}
      {showSkip && !isLastStep && (
        <View className="absolute top-15 right-2.5 z-10">
          <Button variant='ghost' onPress={handleSkip}>
            {skipButtonText}
          </Button>
        </View>
      )}

      {/* Navigation Buttons */}
      <View className="w-full h-[90px] flex-row px-6 pb-10 gap-3">
        {!isFirstStep && (
          <Button variant='outline' onPress={handleBack} style={{ flex: 1 }}>
            {backButtonText}
          </Button>
        )}

        <Button
          variant='default'
          onPress={handleNext}
          style={[...(isFirstStep ? [{flex: 1}] : [{ flex: 2 }])]}
        >
          {isLastStep ? primaryButtonText : nextButtonText}
        </Button>
      </View>
    </View>
  );
}

// Onboarding Hook for managing state
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);

  const completeOnboarding = async () => {
    try {
      // In a real app, you'd save this to AsyncStorage or similar
      setHasCompletedOnboarding(true);
      console.log('Onboarding completed and saved');
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
    }
  };

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    setCurrentOnboardingStep(0);
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  return {
    hasCompletedOnboarding,
    currentOnboardingStep,
    setCurrentOnboardingStep,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
  };
}
