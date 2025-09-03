import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { View, Dimensions, Pressable, ActivityIndicator, Platform } from 'react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Music2, MoreVertical, Sparkles, ChevronUp } from 'lucide-react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useEvent } from 'expo'
import { API_URL } from '@/constants'
import apiService from '@/lib/api'
import { BlurView } from 'expo-blur'
import ReelComments from './ReelComments'
import { useAuth } from '@/contexts/AuthContext'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'

const { createAnimatedComponent } = Animated

export type ReelModel = {
  id: string
  media_url: string
  thumbnail_url?: string | null
  caption?: string | null
  duration?: number | null
  likes_count?: number
  comments_count?: number
  user_id?: string
  created_at?: string
}

type Props = {
  item: ReelModel
  active: boolean
  height?: number
  width?: number
  onLike?: (item: ReelModel) => void
  onCommentPress?: (item: ReelModel) => void
  onShare?: (item: ReelModel) => void
}

const { height: W_HEIGHT, width: W_WIDTH } = Dimensions.get('window')

const ReelItem: React.FC<Props> = React.memo(function ReelItem({
  item,
  active,
  height = W_HEIGHT,
  width = W_WIDTH,
  onLike,
  onCommentPress,
  onShare,
}) {
  type reactions = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
  const reactionMap: Record<reactions, string> = {
    like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡'
  }
  const { user } = useAuth()
  const userId = (user as any)?.id as string | undefined
  const viewRef = useRef<View>(null)
  const lastTap = useRef<number>(0)

  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(!active)
  const [buffering, setBuffering] = useState(true)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [selectedType, setSelectedType] = useState<'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'>('like')
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})
  const [ownType, setOwnType] = useState<'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null>(null)

  const mediaUri = useMemo(() => {
    const url = item.media_url || ''
    return /^https?:\/\//.test(url) ? url : `${API_URL}${url}`
  }, [item.media_url])

  const posterSource = useMemo(
    () => (item.thumbnail_url ? { uri: item.thumbnail_url } : undefined),
    [item.thumbnail_url]
  )

  const player = useVideoPlayer(mediaUri, (p) => {
    p.loop = true
    p.muted = muted
    if (active && !paused) p.play()
    else p.pause()
  })

  // Animations
  const scaleSV = useSharedValue(1)
  const overlaySV = useSharedValue(active ? 1 : 0.85)
  const pausedSV = useSharedValue(!active || paused ? 1 : 0)

  useEffect(() => {
    player.muted = muted
  }, [muted, player])

  useEffect(() => {
    if (active && !paused) player.play()
    else player.pause()
  }, [active, paused, player])

  useEvent(player, 'statusChange', (status: any) => {
    setBuffering(Boolean(status?.isBuffering))
    if (status?.isLoaded && !ready) setReady(true)
  })

  useEvent(player, 'playingChange', (ev: any) => {
    if (typeof ev?.playing === 'boolean') setPaused(!ev.playing)
  })

  // Drive overlay and paused icon animations
  useEffect(() => {
    overlaySV.value = withTiming(active ? 1 : 0.85, { duration: 280, easing: Easing.out(Easing.quad) })
  }, [active, overlaySV])

  useEffect(() => {
    pausedSV.value = withTiming(paused ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) })
  }, [paused, pausedSV])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSV.value }],
  }))

  const overlayFadeUpStyle = useAnimatedStyle(() => ({
    opacity: overlaySV.value,
    transform: [{ translateY: (1 - overlaySV.value) * 12 }],
  }))

  const brandStyle = useAnimatedStyle(() => ({
    opacity: overlaySV.value,
    transform: [{ translateY: (1 - overlaySV.value) * 8 }],
  }))

  const playIconStyle = useAnimatedStyle(() => ({
    opacity: pausedSV.value,
    transform: [{ scale: interpolate(pausedSV.value, [0, 1], [0.9, 1]) }],
  }))

  // Double-tap heart burst
  const heartSV = useSharedValue(0)
  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartSV.value,
    transform: [{ scale: 0.8 + 0.3 * heartSV.value }],
  }))

  useEvent(player, 'timeUpdate', () => {
    try {
      const d = (player as any).duration ?? 0
      const t = (player as any).currentTime ?? 0
      if (d > 0) setProgress(Math.min(1, Math.max(0, t / d)))
      else setProgress(0)
    } catch {}
  })

  const toggleMute = useCallback(() => setMuted((m) => !m), [])
  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause()
      setPaused(true)
    } else {
      player.play()
      setPaused(false)
    }
  }, [player])

  const ensureCounts = useCallback(async () => {
    if (Object.keys(reactionCounts).length) return
    try {
      const res = await apiService.getReactions('reel', item.id)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setReactionCounts(map)
      try {
        const reactionsArr = (res as any)?.reactions as any[] | undefined
        const mine = reactionsArr?.find((r) => r?.user_id === userId)
        if (mine?.reaction_name) {
          setOwnType(mine.reaction_name)
          setSelectedType(mine.reaction_name)
        }
      } catch {}
    } catch {}
  }, [reactionCounts, item.id])

  // Hydrate reactions on initial render
  useEffect(() => {
    ensureCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  const totalReactions = useMemo(() => Object.values(reactionCounts).reduce((a, b) => a + b, 0), [reactionCounts])

  const chooseReaction = useCallback(async (type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => {
    try {
      await apiService.reactToReel(item.id, type)
      setSelectedType(type)
      setOwnType(type)
      const res = await apiService.getReactions('reel', item.id)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setReactionCounts(map)
    } catch {}
    finally {
      setShowReactions(false)
    }
  }, [item.id])

  // ---- Holographic diagonal sheen (restored) ----
  const AnimatedRect = createAnimatedComponent(Rect)
  const sheen = useSharedValue(0)
  useEffect(() => {
    sheen.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.quad) }), -1, true)
  }, [sheen])

  const sheenProps = useAnimatedProps(() => ({
    // sweep a diagonal band across
    x: -width + sheen.value * (width * 2),
  }))

  if (!item.media_url) {
    return (
      <View style={{ height, width }} className="items-center justify-center bg-black">
        <Text className="text-white">Video unavailable</Text>
      </View>
    )
  }

  const borderRadius = 20

  return (
    <Animated.View
      ref={viewRef}
      collapsable={false}
      // subtle press scale feedback
      // @ts-ignore reanimated style
      style={[
        {
          height,
          width,
          borderRadius,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
        cardAnimatedStyle,
      ]}
      className="bg-black"
    >
      <VideoView
        key={item.id}
        style={{ height, width, borderRadius }}
        player={player}
        contentFit="cover"
        // @ts-ignore poster support may vary by SDK version
        posterSource={posterSource}
        usePoster={!!posterSource}
        nativeControls={false}
      />

      {/* Holographic diagonal sheen */}
      <Svg pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
        <Defs>
          <SvgLinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.4} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <AnimatedRect
          animatedProps={sheenProps}
          y={0}
          width={Math.max(80, Math.floor(width * 0.35))}
          height={height}
          fill="url(#sheen)"
          opacity={0.12}
          // rotate around center
          transform={`rotate(-18 ${width / 2} ${height / 2})`}
        />
      </Svg>

      {/* Tap overlay to play/pause */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Play video' : 'Pause video'}
        onPress={() => {
          const now = Date.now()
          if (now - (lastTap.current || 0) < 260) {
            // double tap like burst
            heartSV.value = 0
            heartSV.value = withSequence(
              withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
              withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) })
            )
            onLike?.(item)
          } else {
            togglePlay()
          }
          lastTap.current = now
        }}
        onPressIn={() => {
          scaleSV.value = withSpring(0.98, { damping: 16, stiffness: 180 })
        }}
        onPressOut={() => {
          scaleSV.value = withSpring(1, { damping: 16, stiffness: 180 })
        }}
        className="absolute inset-0"
      />

      {/* Brand badge */}
      <Animated.View style={brandStyle} className="absolute top-10 right-4 flex-row items-center gap-1.5">
        <Icon as={Sparkles} size={18} color={'white'} />
        <Text className="text-xs text-white/95">Reels</Text>
      </Animated.View>
      <Animated.View style={overlayFadeUpStyle} className="absolute items-center py-2 rounded-full bottom-20 right-4" pointerEvents="box-none">
        <BlurView intensity={30} tint="dark" className="items-center py-2 rounded-full" style={{ width: 56 }}>
          <Pressable onPress={toggleMute} hitSlop={10} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute' : 'Mute'} className="items-center py-1">
            <Icon as={muted ? VolumeX : Volume2} size={20} color={'white'} />
          </Pressable>
          {/* Tiny equalizer while playing */}
          <Equalizer active={active && !paused && !muted} />
          <Pressable
            onPress={async () => {
              try {
                // FB-like tap: toggle/set Like
                await ensureCounts()
                if (!ownType) {
                  await chooseReaction('like')
                } else if (ownType === 'like') {
                  await apiService.removeReaction('reel', item.id)
                  setOwnType(null)
                  const res = await apiService.getReactions('reel', item.id)
                  const map: Record<string, number> = {}
                  if (Array.isArray((res as any)?.counts)) {
                    for (const it of (res as any).counts as any[]) {
                      if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
                    }
                  }
                  setReactionCounts(map)
                } else {
                  await chooseReaction('like')
                }
              } catch {}
            }}
            onLongPress={async () => { await ensureCounts(); setShowReactions(true) }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Reactions"
            className="items-center py-1"
          >
            <Text className="text-lg">{reactionMap[selectedType]}</Text>
            <Text className="text-[10px] text-white mt-0.5">{formatCount(totalReactions || (item.likes_count ?? 0))}</Text>
          </Pressable>
          <Pressable onPress={() => { setShowComments(true); onCommentPress?.(item) }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Comments" className="items-center py-1">
            <Icon as={MessageCircle} size={20} color={'white'} />
            <Text className="text-[10px] text-white mt-0.5">{formatCount(item.comments_count ?? 0)}</Text>
          </Pressable>
          <Pressable onPress={() => onShare?.(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Share" className="items-center py-1">
            <Icon as={Share2} size={20} color={'white'} />
          </Pressable>
          <View className="items-center py-1">
            <Icon as={MoreVertical} size={20} color={'white'} />
          </View>
        </BlurView>
      </Animated.View>

      {/* Reactions popover */}
      {showReactions && (
        <BlurView intensity={30} tint="dark" className="absolute px-3 py-2 rounded-full right-20 bottom-28">
          <View className="flex-row items-center gap-3">
            <Text onPress={() => chooseReaction('like')} className="text-xl">👍</Text>
            <Text onPress={() => chooseReaction('love')} className="text-xl">❤️</Text>
            <Text onPress={() => chooseReaction('haha')} className="text-xl">😂</Text>
            <Text onPress={() => chooseReaction('wow')} className="text-xl">😮</Text>
            <Text onPress={() => chooseReaction('sad')} className="text-xl">😢</Text>
            <Text onPress={() => chooseReaction('angry')} className="text-xl">😡</Text>
          </View>
        </BlurView>
      )}

      {/* Swipe hint */}
      <View className="absolute left-0 right-0 items-center bottom-6">
        <View className="flex-row items-center gap-1.5 opacity-80">
          <Icon as={ChevronUp} size={14} color={'white'} />
          <Text className="text-[11px] text-white/90">Swipe for next</Text>
        </View>
      </View>

      {/* Play/Pause indicator */}
      <Animated.View pointerEvents="none" className="absolute inset-0 items-center justify-center" style={playIconStyle}>
        <Icon as={Play} size={48} color={'white'} />
      </Animated.View>

      {/* Heart burst */}
      <Animated.View pointerEvents="none" className="absolute inset-0 items-center justify-center" style={heartStyle}>
        <Icon as={Heart} size={88} color={'#FF2D55'} />
      </Animated.View>

      {/* Comments sheet */}
      <ReelComments
        reelId={item.id}
        visible={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Buffering/loader */}
      {buffering && (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      )}

      {/* Small performance tweaks for Android */}
      {Platform.OS === 'android' && ready && <View className="absolute bottom-0 right-0" style={{ width: 1, height: 1 }} />}
    </Animated.View>
  )
})

export default ReelItem

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return `${n}`
}

// Small animated equalizer used in the action rail
const Equalizer: React.FC<{ active: boolean }> = ({ active }) => {
  const t = useSharedValue(0)

  useEffect(() => {
    if (active) {
      t.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true)
    } else {
      t.value = withTiming(0, { duration: 200 })
    }
  }, [active, t])

  const bar = (phase: number) =>
    useAnimatedStyle(() => {
      // 8..22 height with phase offset
      const wave = Math.abs(Math.sin(Math.PI * 2 * (t.value + phase)))
      const h = 8 + 14 * wave
      return { height: h }
    })

  const b1 = bar(0)
  const b2 = bar(0.2)
  const b3 = bar(0.4)
  const b4 = bar(0.6)

  const Bar = ({ style }: { style: any }) => (
    <Animated.View style={[{ width: 3, borderRadius: 2, backgroundColor: 'white' }, style]} />
  )

  return (
    <View className="flex-row items-end justify-center gap-1 py-1">
      <Bar style={b1} />
      <Bar style={b2} />
      <Bar style={b3} />
      <Bar style={b4} />
    </View>
  )
}
