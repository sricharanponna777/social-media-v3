import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BORDER_RADIUS, FONT_SIZE } from '@/theme/globals';
import {
  CameraMode,
  CameraRatio,
  CameraType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import {
  Camera as CameraIcon,
  Grid3X3,
  Settings,
  SwitchCamera,
  Timer,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Progress } from './progress';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type CaptureSuccess = {
  type: CameraMode;
  uri: string;
  cameraHeight: number;
};
export interface CameraProps {
  style?: ViewStyle;
  facing?: CameraType;
  enableTorch?: boolean;
  showControls?: boolean;
  timerOptions?: Array<number>;
  enableVideo?: boolean;
  maxVideoDuration?: number; // in seconds
  onClose?: () => void;
  onCapture?: ({ type, uri, cameraHeight }: CaptureSuccess) => void;
  onVideoCapture?: ({ type, uri, cameraHeight }: CaptureSuccess) => void;
}

export interface CameraRef extends CameraView {
  switchCamera: () => void;
  toggleTorch: () => void;
  takePicture: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export const Camera = forwardRef<CameraRef, CameraProps>(
  (
    {
      style,
      onCapture,
      onVideoCapture,
      onClose,
      enableTorch = true,
      showControls = true,
      enableVideo = true,
      maxVideoDuration = 60,
      timerOptions = [0, 3, 10],
      facing: initialFacing = 'back',
    },
    ref
  ) => {
    const cameraRef = useRef<CameraView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const recordingInterval = useRef<number | null>(null);
    const timerInterval = useRef<number | null>(null);
    const settingsAnim = useRef(new Animated.Value(0)).current;
    const zoomTextAnim = useRef(new Animated.Value(0)).current;
    const zoomControlsAnim = useRef(new Animated.Value(0)).current;
    const baseZoom = useRef(0);
    const lastZoom = useRef(0);

    const aspectRatios: Array<CameraRatio> = ['16:9', '4:3', '1:1'];

    const [permission, requestPermission] = useCameraPermissions();
    const [torch, setTorch] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mode, setMode] = useState<CameraMode>('picture');
    const [facing, setFacing] = useState<CameraType>(initialFacing);
    const [showGrid, setShowGrid] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [selectedTimer, setSelectedTimer] = useState<number>(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [zoom, setZoom] = useState(0);
    const [aspectRatioIndex, setAspectRatioIndex] = useState(1); // 0: 16:9, 1: 4:3, 2: 1:1
    const [zoomControls, setZoomControls] = useState(false);
    const [availableZoomFactors, setAvailableZoomFactors] = useState<number[]>([
      0,
      0.25,
      0.5,
      0.75,
      1.0, // Zoom levels: 1x, 2x, 3x, 4x, 5x
    ]);
    const [currentZoomIndex, setCurrentZoomIndex] = useState(0);

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const destructiveColor = useThemeColor({}, 'destructive');

    // Modern gesture handler for pinch-to-zoom
    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        const newZoom = Math.min(
          Math.max(baseZoom.current + (event.scale - 1) * 0.5, 0),
          1
        );
        setZoom(newZoom);
      })
      .onEnd(() => {
        baseZoom.current = zoom;
        showZoomIndicator();
      });

    // Double tap gesture for quick zoom
    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        const newZoom = zoom > 0 ? 0 : 0.5;
        setZoom(newZoom);
        baseZoom.current = newZoom;
        showZoomIndicator();
      });

    // Combined gestures
    const composedGestures = Gesture.Simultaneous(
      pinchGesture,
      doubleTapGesture
    );

    // @ts-ignore
    useImperativeHandle(ref, () => {
      if (!cameraRef.current) {
        return {} as CameraRef; // fallback to empty cast to satisfy types
      }

      const cam = cameraRef.current as CameraRef;

      return {
        ...cam,
        switchCamera: toggleCameraFacing,
        toggleTorch,
        takePicture: handleCapture,
        startRecording: handleStartRecording,
        stopRecording: handleStopRecording,
      };
    });

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim]);

    useEffect(() => {
      return () => {
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
        }
      };
    }, []);

    const getCameraHeight = () => {
      const currentAspectRatio = aspectRatios[aspectRatioIndex];
      switch (currentAspectRatio) {
        case '16:9':
          return (screenWidth * 16) / 9;
        case '1:1':
          return screenWidth;
        case '4:3':
        default:
          return (screenWidth * 4) / 3;
      }
    };

    const startTimer = (seconds: number) => {
      setTimerSeconds(seconds);
      setIsTimerActive(true);

      timerInterval.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
              timerInterval.current = null;
            }
            // Execute the actual capture/recording
            setTimeout(() => {
              if (mode === 'picture') {
                handleActualCapture();
              } else {
                handleStartRecording();
              }
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const cancelTimer = () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      setIsTimerActive(false);
      setTimerSeconds(0);
    };

    const handleActualCapture = async () => {
      if (!cameraRef.current || isCapturing || isRecording) return;

      try {
        setIsCapturing(true);

        // if (soundEnabled) {
        //   Vibration.vibrate(50);
        // }

        const picture = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          exif: true,
        });

        if (picture && onCapture) {
          onCapture({
            type: 'picture',
            uri: picture.uri,
            cameraHeight: getCameraHeight(),
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      } finally {
        setIsCapturing(false);
      }
    };

    const handleStartRecording = async () => {
      if (!cameraRef.current || isRecording || isCapturing) return;

      try {
        setIsRecording(true);
        setRecordingTime(0);

        // if (soundEnabled) {
        //   Vibration.vibrate([0, 100, 50, 100]);
        // }

        recordingInterval.current = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev >= maxVideoDuration) {
              handleStopRecording();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);

        const video = await cameraRef.current.recordAsync({
          maxDuration: maxVideoDuration,
        });

        if (video && onVideoCapture) {
          onVideoCapture({
            type: 'video',
            uri: video.uri,
            cameraHeight: getCameraHeight(),
          });
        }
      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert('Error', 'Failed to start recording');
        setIsRecording(false);
      }
    };

    const handleCapture = async () => {
      if (isCapturing || isRecording || isTimerActive) return;

      if (selectedTimer > 0) {
        startTimer(selectedTimer);
      } else {
        if (mode === 'picture') {
          handleActualCapture();
        } else {
          handleStartRecording();
        }
      }
    };

    const handleStopRecording = async () => {
      if (!cameraRef.current || !isRecording) return;

      try {
        await cameraRef.current.stopRecording();

        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
          recordingInterval.current = null;
        }

        // if (soundEnabled) {
        //   Vibration.vibrate(100);
        // }
      } catch (error) {
        console.error('Error stopping recording:', error);
      } finally {
        setIsRecording(false);
        setRecordingTime(0);
      }
    };

    const toggleCameraFacing = () => {
      setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    const toggleTorch = () => {
      setTorch((current) => !current);
    };

    const toggleMode = () => {
      if (!isRecording && !isCapturing) {
        setMode((current) => (current === 'picture' ? 'video' : 'picture'));
      }
    };

    const toggleSettings = () => {
      setShowSettings((prev) => {
        const newValue = !prev;
        Animated.timing(settingsAnim, {
          toValue: newValue ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        return newValue;
      });
    };

    const showZoomIndicator = () => {
      Animated.sequence([
        Animated.timing(zoomTextAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(zoomTextAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handleZoomSliderChange = (value: number) => {
      setZoom(value / 100); // Convert from 0-100 to 0-1
      baseZoom.current = value / 100;
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    };

    const getTimerButtonText = () => {
      if (selectedTimer === 0) return 'OFF';
      return `${selectedTimer}s`;
    };

    const getZoomFactor = () => {
      return zoom === 0 ? '1×' : `${(1 + zoom * 4).toFixed(0)}×`;
    };

    // New zoom button handlers
    const handleZoomButtonTap = () => {
      // Cycle through available zoom levels
      const nextIndex = (currentZoomIndex + 1) % availableZoomFactors.length;
      const nextZoom = availableZoomFactors[nextIndex];

      setCurrentZoomIndex(nextIndex);
      setZoom(nextZoom);
      baseZoom.current = nextZoom;
      showZoomIndicator();

      // if (soundEnabled) {
      //   Vibration.vibrate([1]); // Light haptic feedback
      // }
    };

    if (!permission) {
      return (
        <View style={[{ backgroundColor }, style]} className="flex-1 justify-center items-center">
          <ActivityIndicator size='large' color={primaryColor} />
          <Text style={{ color: textColor }} className="mt-4 text-base">
            Loading camera...
          </Text>
        </View>
      );
    }

    return !permission.granted ? (
      <View
        style={{ backgroundColor: cardColor }}
        className="gap-4 p-8 rounded-lg items-center"
      >
        <CameraIcon size={36} color={textColor} className="mb-4" />

        <Text variant='title' className="text-center">
          Camera Access Required
        </Text>

        <Text variant='body' className="text-center">
          We need access to your camera to take pictures and videos
        </Text>

        <View className="w-full">
          <Button onPress={requestPermission} className="w-full">
            Grant Permission
          </Button>
        </View>
      </View>
    ) : (
      <Animated.View
        style={[
          { backgroundColor, opacity: fadeAnim },
          style,
        ]}
        className="flex-1 justify-center items-center"
      >
        <View style={{ height: getCameraHeight() }} className="w-screen rounded-lg overflow-hidden">
          <GestureDetector gesture={composedGestures}>
            <Animated.View className="flex-1">
              <CameraView
                ref={cameraRef}
                mode={mode}
                style={{flex: 1}}
                facing={facing}
                enableTorch={torch}
                animateShutter={true}
                zoom={zoom}
                mirror={mode === 'picture' && facing === 'front'}
                ratio={aspectRatios[aspectRatioIndex]}
              >
                {/* Grid Overlay */}
                {showGrid && (
                  <View className="absolute inset-0 z-10">
                    <View className="flex-1 relative">
                      <View className="absolute bg-white/30 left-1/3 top-0 bottom-0 w-px" />
                      <View className="absolute bg-white/30 left-2/3 top-0 bottom-0 w-px" />
                      <View className="absolute bg-white/30 top-1/3 left-0 right-0 h-px" />
                      <View className="absolute bg-white/30 top-2/3 left-0 right-0 h-px" />
                    </View>
                  </View>
                )}

                {/* Zoom Indicator */}
                <Animated.View
                  style={{ opacity: zoomTextAnim }}
                  className="absolute top-[45%] self-center bg-black/70 px-4 py-2 rounded-full z-20"
                  pointerEvents='none'
                >
                  <Text className="text-white text-base font-bold text-center">{getZoomFactor()}</Text>
                </Animated.View>

                {/* Zoom Controls */}
                {zoomControls && (
                  <Animated.View
                    style={{
                        opacity: zoomControlsAnim,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      }}
                    className="absolute right-5 top-1/4 p-3 rounded-xl justify-center items-center z-50"
                    pointerEvents={zoomControls ? 'auto' : 'none'}
                  >
                    <View className="h-[200px] justify-between items-center py-2.5 -rotate-90">
                      <Text style={{ color: 'white' }} className="text-sm font-bold">
                        1×
                      </Text>
                      <Progress
                        interactive
                        value={zoom * 100}
                        onValueChange={handleZoomSliderChange}
                        style={{width: 160, borderRadius: 999}}
                        height={6}
                      />
                      <Text style={{ color: 'white' }} className="text-sm font-bold">
                        5×
                      </Text>
                    </View>
                    <Text style={{ color: 'white' }} className="mt-3 text-xs font-semibold">
                      {getZoomFactor()}
                    </Text>
                  </Animated.View>
                )}

                {/* Timer Overlay */}
                {isTimerActive && (
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/50 justify-center items-center z-30"
                    onPress={cancelTimer}
                    activeOpacity={1}
                  >
                    <Text className="text-7xl font-bold text-white text-center">{timerSeconds}</Text>
                    <View className="absolute top-[60px] right-5 w-12 h-12 rounded-full bg-black/70 justify-center items-center">
                      <X size={20} color='white' />
                    </View>
                    <Text className="absolute bottom-[100px] text-white text-base text-center">Tap to cancel</Text>
                  </TouchableOpacity>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <View className="absolute top-5 left-5 flex-row items-center bg-red-500/80 px-3 py-1.5 rounded-full z-20">
                    <View className="w-2 h-2 rounded-full bg-white mr-2" />
                    <Text className="text-white text-sm font-bold">
                      REC {formatTime(recordingTime)}
                    </Text>
                  </View>
                )}

                {showControls && (
                  <>
                    {/* Top Controls */}
                    <View className="absolute top-5 left-5 right-5 flex-row justify-between items-center z-10">
                      <View className="flex-1 items-start">
                        {onClose && (
                          <TouchableOpacity
                            style={{ backgroundColor: cardColor }}
                            className="w-12 h-12 rounded-full justify-center items-center bg-black/50"
                            onPress={onClose}
                            activeOpacity={0.7}
                          >
                            <X size={24} color={textColor} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View className="flex-1 items-center">
                        <Text style={{ color: textColor }} className="text-base font-bold text-shadow-lg">
                          {mode.toUpperCase()}
                        </Text>
                      </View>

                      <View className="flex-1 items-end">
                        <TouchableOpacity
                          style={{ backgroundColor: cardColor }}
                          className="w-12 h-12 rounded-full justify-center items-center bg-black/50"
                          onPress={toggleSettings}
                          activeOpacity={0.7}
                        >
                          <Settings size={24} color={textColor} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Settings Panel */}
                    <Animated.View
                      style={[
                        {
                          backgroundColor: cardColor,
                          opacity: settingsAnim,
                          transform: [
                            {
                              translateY: settingsAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-100, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                      className="absolute top-[76px] left-5 right-5 rounded-lg p-4 z-20"
                      pointerEvents={showSettings ? 'auto' : 'none'}
                    >
                      <View className="flex-row justify-around items-center">
                        <TouchableOpacity
                          style={showGrid && { backgroundColor: primaryColor }}
                          className="w-12 h-12 rounded-full justify-center items-center"
                          onPress={() => setShowGrid(!showGrid)}
                        >
                          <Grid3X3
                            size={20}
                            color={showGrid ? cardColor : textColor}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                              backgroundColor: soundEnabled
                                ? primaryColor
                                : cardColor,
                            }}
                          className="w-12 h-12 rounded-full justify-center items-center"
                          onPress={() => setSoundEnabled(!soundEnabled)}
                        >
                          {soundEnabled ? (
                            <Volume2 size={20} color={cardColor} />
                          ) : (
                            <VolumeX size={20} color={textColor} />
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ backgroundColor: cardColor }}
                          className="w-12 h-12 rounded-full justify-center items-center"
                          onPress={() =>
                            setAspectRatioIndex((prev) => (prev + 1) % 3)
                          }
                        >
                          <Text
                            style={{ color: textColor }}
                            className="text-xs font-bold"
                          >
                            {aspectRatios[aspectRatioIndex]}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                              backgroundColor:
                                selectedTimer > 0 ? primaryColor : cardColor,
                            }}
                          className="w-12 h-12 rounded-full justify-center items-center"
                          onPress={() => {
                            const currentIndex =
                              timerOptions.indexOf(selectedTimer);
                            const nextIndex =
                              (currentIndex + 1) % timerOptions.length;
                            setSelectedTimer(timerOptions[nextIndex]);
                          }}
                        >
                          <Timer
                            size={16}
                            color={selectedTimer > 0 ? cardColor : textColor}
                          />
                          <Text
                            style={{
                                color:
                                  selectedTimer > 0 ? cardColor : textColor,
                              }}
                            className="text-[10px] font-bold mt-0.5"
                          >
                            {getTimerButtonText()}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>

                    {/* Side Controls */}
                    <View className="absolute right-5 top-1/2 -translate-y-[120px] gap-4 z-10">
                      {enableTorch && facing === 'back' && (
                        <TouchableOpacity
                          style={{
                              backgroundColor: torch ? primaryColor : cardColor,
                            }}
                          className="w-12 h-12 rounded-full justify-center items-center bg-black/50"
                          onPress={toggleTorch}
                          activeOpacity={0.7}
                        >
                          {torch ? (
                            <Zap size={24} color={cardColor} />
                          ) : (
                            <ZapOff size={24} color={textColor} />
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={{ backgroundColor: cardColor }}
                        className="w-12 h-12 rounded-full justify-center items-center bg-black/50"
                        onPress={toggleCameraFacing}
                        activeOpacity={0.7}
                      >
                        <SwitchCamera size={24} color={textColor} />
                      </TouchableOpacity>

                      {/* New Zoom Control Button */}
                      <TouchableOpacity
                        style={{
                            backgroundColor: zoomControls
                              ? primaryColor
                              : cardColor,
                          }}
                        className="w-12 h-12 rounded-full justify-center items-center bg-black/50"
                        onPress={handleZoomButtonTap}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontWeight: 600,
                            color: zoomControls ? cardColor : textColor,
                          }}
                        >
                          {getZoomFactor()}
                        </Text>
                      </TouchableOpacity>

                      {/* Mode Toggle Button */}
                      {enableVideo && (
                        <TouchableOpacity
                          style={{ backgroundColor: cardColor }}
                          className="w-12 h-12 rounded-full justify-center items-center bg-black/50"
                          onPress={toggleMode}
                          disabled={isRecording || isCapturing}
                          activeOpacity={0.7}
                        >
                          {mode === 'picture' ? (
                            <Video size={24} color={textColor} />
                          ) : (
                            <CameraIcon size={24} color={textColor} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Bottom Controls */}
                    <View className="absolute bottom-10 left-5 right-5 flex-row justify-center items-center z-10">
                      {/* Main Capture Button */}
                      <TouchableOpacity
                        style={[
                          {
                            backgroundColor:
                              mode === 'video' && isRecording
                                ? destructiveColor
                                : 'white',
                            borderColor:
                              mode === 'video' && isRecording
                                ? destructiveColor
                                : primaryColor,
                          },
                          (isCapturing || isTimerActive) &&
                            {transform: [{ scale: 0.9 }]},
                        ]}
                        className="w-20 h-20 rounded-full border-4 justify-center items-center bg-white"
                        onPress={
                          mode === 'picture'
                            ? handleCapture
                            : isRecording
                            ? handleStopRecording
                            : handleCapture
                        }
                        disabled={isCapturing || isTimerActive}
                        activeOpacity={0.8}
                      >
                        {isCapturing ? (
                          <ActivityIndicator
                            size='small'
                            color={primaryColor}
                          />
                        ) : (
                          <View
                            style={{
                                backgroundColor:
                                  mode === 'video' && isRecording
                                    ? 'white'
                                    : primaryColor,
                                borderRadius:
                                  mode === 'video' && isRecording ? 4 : 30,
                              }}
                            className="w-8 h-8"
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </CameraView>
            </Animated.View>
          </GestureDetector>
        </View>
      </Animated.View>
    );
  }
);

Camera.displayName = 'Camera';

export default Camera;
