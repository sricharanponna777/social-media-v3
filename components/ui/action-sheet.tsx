import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CORNERS, FONT_SIZE } from '@/theme/globals';
import React, { useEffect, useRef } from 'react';
import {
  ActionSheetIOS,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

export interface ActionSheetOption {
  title: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelButtonTitle?: string;
  style?: ViewStyle;
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  cancelButtonTitle = 'Cancel',
  style,
}: ActionSheetProps) {
  // Use iOS native ActionSheet on iOS
  if (Platform.OS === 'ios') {
    useEffect(() => {
      if (visible) {
        const optionTitles = options.map((option) => option.title);
        const destructiveButtonIndex = options.findIndex(
          (option) => option.destructive
        );
        const disabledButtonIndices = options
          .map((option, index) => (option.disabled ? index : -1))
          .filter((index) => index !== -1);

        ActionSheetIOS.showActionSheetWithOptions(
          {
            title,
            message,
            options: [...optionTitles, cancelButtonTitle],
            cancelButtonIndex: optionTitles.length,
            destructiveButtonIndex:
              destructiveButtonIndex !== -1
                ? destructiveButtonIndex
                : undefined,
            disabledButtonIndices:
              disabledButtonIndices.length > 0
                ? disabledButtonIndices
                : undefined,
          },
          (buttonIndex) => {
            if (buttonIndex < optionTitles.length) {
              options[buttonIndex].onPress();
            }
            onClose();
          }
        );
      }
    }, [visible, title, message, options, cancelButtonTitle, onClose]);

    // Return null for iOS as we use the native ActionSheet
    return null;
  }

  // Custom implementation for Android and other platforms
  return (
    <AndroidActionSheet
      {...{
        visible,
        onClose,
        title,
        message,
        options,
        cancelButtonTitle,
        style,
      }}
    />
  );
}

// Custom ActionSheet implementation for Android
function AndroidActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  cancelButtonTitle,
  style,
}: ActionSheetProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');
  const destructiveColor = useThemeColor({}, 'red');

  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backgroundOpacity]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  const handleOptionPress = (option: ActionSheetOption) => {
    if (!option.disabled) {
      option.onPress();
      onClose();
    }
  };

  const handleBackdropPress = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType='none'
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Animated.View
          style={[
            {
              opacity: backgroundOpacity,
            },
          ]}
          className="absolute inset-0 bg-black/50"
        >
          <Pressable
            className="flex-1"
            onPress={handleBackdropPress}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              backgroundColor: cardColor,
              transform: [{ translateY }],
            },
            style,
          ]}
          className="rounded-t-lg pb-[34px] max-h-[80%] elevation-10 shadow-black shadow-offset-0 -2 shadow-opacity-25 shadow-radius-10"
        >
          {/* Header */}
          {(title || message) && (
            <View className="px-5 pt-5 pb-4 items-center">
              {title && (
                <Text
                  style={{
                      color: textColor,
                    }}
                  className="text-lg font-semibold text-center mb-1"
                  numberOfLines={2}
                >
                  {title}
                </Text>
              )}
              {message && (
                <Text
                  style={{
                      color: mutedColor,
                    }}
                  className="text-sm text-center leading-5"
                  numberOfLines={3}
                >
                  {message}
                </Text>
              )}
            </View>
          )}

          {/* Options */}
          <ScrollView
            className="max-h-[300px]"
            showsVerticalScrollIndicator={false}
          >
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={{
                    borderBottomColor: borderColor,
                  }}
                className={`border-b px-5 py-4 ${
                  index === options.length - 1 && 'border-b-0'
                } ${
                  option.disabled && 'opacity-50'
                }`}
                onPress={() => handleOptionPress(option)}
                disabled={option.disabled}
                activeOpacity={0.6}
              >
                <View className="flex-row items-center">
                  {option.icon && (
                    <View className="mr-3 w-6 h-6 items-center justify-center">{option.icon}</View>
                  )}
                  <Text
                    style={{
                        color: option.destructive
                          ? destructiveColor
                          : option.disabled
                          ? mutedColor
                          : textColor,
                      }}
                    className="text-base font-medium flex-1"
                    numberOfLines={1}
                  >
                    {option.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cancel Button */}
          <View
            style={{
                borderTopColor: borderColor,
              }}
            className="border-t mt-2"
          >
            <TouchableOpacity
              className="px-5 py-4 items-center"
              onPress={onClose}
              activeOpacity={0.6}
            >
              <Text
                style={{
                    color: textColor,
                  }}
                className="text-base font-semibold"
              >
                {cancelButtonTitle}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Hook for easier ActionSheet usage
export function useActionSheet() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [config, setConfig] = React.useState<
    Omit<ActionSheetProps, 'visible' | 'onClose'>
  >({
    options: [],
  });

  const show = React.useCallback(
    (actionSheetConfig: Omit<ActionSheetProps, 'visible' | 'onClose'>) => {
      setConfig(actionSheetConfig);
      setIsVisible(true);
    },
    []
  );

  const hide = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  const ActionSheetComponent = React.useMemo(
    () => <ActionSheet visible={isVisible} onClose={hide} {...config} />,
    [isVisible, hide, config]
  );

  return {
    show,
    hide,
    ActionSheet: ActionSheetComponent,
    isVisible,
  };
}
