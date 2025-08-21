import { AudioWaveform } from '@/components/ui/audio-waveform';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BORDER_RADIUS } from '@/theme/globals';
import { AudioSource, useAudioPlayer } from 'expo-audio';
import { Pause, Play, RotateCcw, Square } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { View, ViewStyle } from 'react-native';

export interface AudioPlayerProps {
  source: AudioSource;
  style?: ViewStyle;
  showControls?: boolean;
  showWaveform?: boolean;
  showTimer?: boolean;
  showProgressBar?: boolean;
  autoPlay?: boolean;
  onPlaybackStatusUpdate?: (status: any) => void;
}

export function AudioPlayer({
  source,
  style,
  showControls = true,
  showWaveform = true,
  showTimer = true,
  showProgressBar = true,
  autoPlay = false,
  onPlaybackStatusUpdate,
}: AudioPlayerProps) {
  const player = useAudioPlayer(source);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Enhanced waveform data - more bars for smoother visualization
  const [waveformData] = useState<number[]>(
    Array.from({ length: 60 }, (_, i) => {
      // Create more varied and realistic waveform pattern
      const base1 = Math.sin((i / 60) * Math.PI * 6) * 0.4 + 0.5;
      const base2 = Math.sin((i / 60) * Math.PI * 2.5) * 0.3 + 0.4;
      const noise = (Math.random() - 0.5) * 0.25;
      const peak = Math.random() < 0.15 ? Math.random() * 0.4 : 0; // Occasional peaks
      return Math.max(0.15, Math.min(0.95, (base1 + base2) / 2 + noise + peak));
    })
  );

  // Theme colors
  const redColor = useThemeColor({}, 'destructive');
  const secondaryColor = useThemeColor({}, 'secondary');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');

  useEffect(() => {
    if (autoPlay && player.isLoaded && !player.playing) {
      player.play();
    }
  }, [autoPlay, player.isLoaded]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.isLoaded && !isSeeking) {
        const currentTime = player.currentTime || 0;
        const totalDuration = player.duration || 0;

        setDuration(totalDuration);
        setPosition(currentTime);

        // Check if the audio finished
        if (currentTime >= totalDuration && totalDuration > 0) {
          player.seekTo(0);
          player.pause(); // Ensure it's paused
        }

        if (onPlaybackStatusUpdate) {
          onPlaybackStatusUpdate({
            isLoaded: player.isLoaded,
            playing: player.playing,
            duration: totalDuration,
            position: currentTime,
          });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, onPlaybackStatusUpdate, isSeeking]);

  const handlePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleBackFiveSeconds = () => {
    const newPosition = Math.max(0, position - 5);
    seekToPosition(newPosition);
  };

  const handleRestart = () => {
    seekToPosition(0);
  };

  // Unified seeking function
  const seekToPosition = useCallback(
    (newPosition: number) => {
      if (player.isLoaded && duration > 0) {
        const clampedPosition = Math.max(0, Math.min(duration, newPosition));
        player.seekTo(clampedPosition);
        setPosition(clampedPosition);
      }
    },
    [player, duration]
  );

  // Handle waveform seeking
  const handleWaveformSeek = useCallback(
    (seekPercentage: number) => {
      if (duration > 0) {
        const newPosition = (seekPercentage / 100) * duration;
        seekToPosition(newPosition);
      }
    },
    [duration, seekToPosition]
  );

  // Handle progress bar seeking
  const handleProgressSeek = useCallback(
    (progressValue: number) => {
      if (duration > 0) {
        const newPosition = (progressValue / 100) * duration;
        seekToPosition(newPosition);
      }
    },
    [duration, seekToPosition]
  );

  // Handle seeking start/end for smooth updates
  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View
      style={[{ backgroundColor: secondaryColor }, style]}
      className="rounded-lg p-4 m-2"
    >
      {/* Waveform Visualization with seeking capability */}
      {showWaveform && (
        <View className="items-center mb-3">
          <AudioWaveform
            data={waveformData}
            isPlaying={player.playing}
            progress={progressPercentage}
            onSeek={handleWaveformSeek}
            onSeekStart={handleSeekStart}
            onSeekEnd={handleSeekEnd}
            height={80}
            barCount={60}
            barWidth={4}
            barGap={1.5}
            activeColor={redColor}
            inactiveColor={mutedColor}
            animated={true}
            showProgress={true}
            interactive={true} // Enable seeking
          />
        </View>
      )}

      {/* Interactive Progress Bar */}
      {showProgressBar && (
        <View className="mb-3 px-1">
          <Progress
            value={progressPercentage}
            onValueChange={handleProgressSeek}
            onSeekStart={handleSeekStart}
            onSeekEnd={handleSeekEnd}
            interactive={true}
            height={6}
          />
        </View>
      )}

      {/* Controls */}
      {showControls && (
        <View className="flex-row items-center justify-center gap-3 mb-2">
          <Button
            variant='ghost'
            size='icon'
            onPress={handleBackFiveSeconds}
            className="w-10 h-10"
            disabled={!player.isLoaded}
          >
            <RotateCcw size={18} color={textColor} />
          </Button>

          <Button
            size='icon'
            variant='destructive'
            onPress={handlePlayPause}
            disabled={!player.isLoaded}
            className="w-14 h-14"
          >
            {player.playing ? (
              <Pause size={24} color='white' />
            ) : (
              <Play size={24} color='white' />
            )}
          </Button>

          <Button
            variant='ghost'
            size='icon'
            onPress={handleRestart}
            className="w-10 h-10"
            disabled={!player.isLoaded}
          >
            <Square fill={textColor} size={18} color={textColor} />
          </Button>
        </View>
      )}

      {/* Timer */}
      {showTimer && (
        <View className="items-center">
          <Text variant='caption' style={{ color: mutedColor }}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>
      )}

      {/* Loading State */}
      {!player.isLoaded && (
        <View className="items-center p-2">
          <Text variant='caption' style={{ color: mutedColor }}>
            Loading audio...
          </Text>
        </View>
      )}
    </View>
  );
}
