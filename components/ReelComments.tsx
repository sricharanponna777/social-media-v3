import React, { useCallback, useEffect, useState } from 'react'
import { View, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { BlurView } from 'expo-blur'
import apiService from '@/lib/api'
import { Icon } from '@/components/ui/icon'
import { ThumbsUp, MessageCircle, ChevronUp, ChevronDown, Send } from 'lucide-react-native'
import { useAuth } from '@/contexts/AuthContext'

type Comment = {
  id: string
  user?: { id?: string; name?: string }
  content: string
  created_at?: string
}

interface ReelCommentsProps {
  reelId: string
  visible: boolean
  onClose: () => void
  onAdded?: () => void
}

const ReelComments: React.FC<ReelCommentsProps> = ({ reelId, visible, onClose, onAdded }) => {
  type reactions = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
  const reactionMap: Record<reactions, string> = {
    like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡'
  }
  const { user } = useAuth()
  const userId = (user as any)?.id as string | undefined
  const [comments, setComments] = useState<Comment[]>([])
  const [repliesByParent, setRepliesByParent] = useState<Record<string, Comment[]>>({})
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [countsByComment, setCountsByComment] = useState<Record<string, Record<string, number>>>({})
  const [selectedByComment, setSelectedByComment] = useState<Record<string, 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'>>({})
  const [ownTypeByComment, setOwnTypeByComment] = useState<Record<string, 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null>>({})

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getReelComments(reelId, 1, 50).catch(() => ({ comments: [] as Comment[] }))
      const items: Comment[] = Array.isArray(data) ? data : (Array.isArray((data as any)?.comments) ? (data as any).comments : [])
      setComments(items)
    } finally {
      setLoading(false)
    }
  }, [reelId])

  useEffect(() => {
    if (visible) load()
  }, [visible, load])

  // Hydrate reaction data for top-level comments when shown
  useEffect(() => {
    if (!visible || !comments.length) return
    ;(async () => {
      try {
        for (const c of comments) {
          await ensureCounts(c.id)
        }
      } catch {}
    })()
  }, [visible, comments, ensureCounts])

  const send = async () => {
    if (!text.trim()) return
    try {
      setSending(true)
      await apiService.commentOnReel(reelId, text.trim())
      const newItem: Comment = { id: Math.random().toString(36).slice(2), content: text.trim() }
      setComments((prev) => [newItem, ...prev])
      setText('')
      onAdded?.()
    } finally {
      setSending(false)
    }
  }

  const toggleReplies = async (parentId: string) => {
    const opened = Array.isArray(repliesByParent[parentId])
    if (opened) {
      // collapse
      setRepliesByParent((m) => {
        const { [parentId]: _, ...rest } = m
        return rest
      })
      return
    }
    setLoadingReplies((s) => ({ ...s, [parentId]: true }))
    try {
      const data = await apiService.getCommentReplies(parentId, 1, 50).catch(() => ({ replies: [] as Comment[] }))
      const items: Comment[] = Array.isArray(data) ? data : (Array.isArray((data as any)?.replies) ? (data as any).replies : [])
      setRepliesByParent((m) => ({ ...m, [parentId]: items }))
      // Hydrate reactions for loaded replies
      try {
        for (const r of items) {
          await ensureCounts(r.id)
        }
      } catch {}
    } finally {
      setLoadingReplies((s) => ({ ...s, [parentId]: false }))
    }
  }

  const sendReply = async (parentId: string) => {
    const body = replyText.trim()
    if (!body) return
    try {
      setSending(true)
      await apiService.replyToComment(parentId, body)
      const item: Comment = { id: Math.random().toString(36).slice(2), content: body }
      setRepliesByParent((m) => ({ ...m, [parentId]: [item, ...(m[parentId] || [])] }))
      setReplyText('')
      setReplyFor(null)
    } finally {
      setSending(false)
    }
  }

  const ensureCounts = useCallback(async (commentId: string) => {
    if (countsByComment[commentId]) return
    try {
      const res = await apiService.getReactions('comment', commentId)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setCountsByComment((m) => ({ ...m, [commentId]: map }))
      try {
        const reactionsArr = (res as any)?.reactions as any[] | undefined
        const mine = reactionsArr?.find((r) => r?.user_id === userId)
        if (mine?.reaction_name) {
          setOwnTypeByComment((m) => ({ ...m, [commentId]: mine.reaction_name }))
          setSelectedByComment((m) => ({ ...m, [commentId]: mine.reaction_name }))
        }
      } catch {}
    } catch {}
  }, [countsByComment])

  const chooseReaction = useCallback(async (commentId: string, type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => {
    try {
      await apiService.reactToComment(commentId, type)
      setSelectedByComment((m) => ({ ...m, [commentId]: type }))
      setOwnTypeByComment((m) => ({ ...m, [commentId]: type }))
      const res = await apiService.getReactions('comment', commentId)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setCountsByComment((m) => ({ ...m, [commentId]: map }))
    } catch {}
    finally {
      setPickerFor(null)
    }
  }, [])

  const countFor = useCallback((commentId: string) => {
    const sel = selectedByComment[commentId] || 'like'
    const map = countsByComment[commentId]
    return map?.[sel] ?? 0
  }, [countsByComment, selectedByComment])

  const ReactionsChip = ({
    commentId,
    countsByComment,
    setCountsByComment,
    selectedByComment,
    setSelectedByComment,
    pickerFor,
    setPickerFor,
  }: any) => {
    const total = React.useMemo(() => {
      const map = countsByComment[commentId] || {}
      return Object.values(map).reduce((a: number, b: number) => a + b, 0)
    }, [commentId, countsByComment])
    return (
      <TouchableOpacity
        className="flex-row items-center gap-1"
        onPress={async () => {
          await ensureCounts(commentId)
          const mine = ownTypeByComment[commentId]
          try {
            if (!mine) {
              await chooseReaction(commentId, 'like')
            } else if (mine === 'like') {
              await apiService.removeReaction('comment', commentId)
              setOwnTypeByComment((m) => ({ ...m, [commentId]: null }))
              // refresh counts
              const res = await apiService.getReactions('comment', commentId)
              const map: Record<string, number> = {}
              if (Array.isArray((res as any)?.counts)) {
                for (const it of (res as any).counts as any[]) {
                  if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
                }
              }
              setCountsByComment((m: any) => ({ ...m, [commentId]: map }))
            } else {
              await chooseReaction(commentId, 'like')
            }
          } catch {}
        }}
        onLongPress={async () => { await ensureCounts(commentId); setPickerFor(commentId) }}
        activeOpacity={0.7}
      >
        {ownTypeByComment[commentId]
          ? <Text>{reactionMap[ownTypeByComment[commentId]]}</Text>
          : <Icon as={ThumbsUp} size={14} color={'white'} />}
        <Text className="text-xs text-white/80">{total}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="justify-end flex-1 pb-7 bg-black/50">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className='p-3'>
          <BlurView intensity={40} tint="dark" className="absolute inset-0" />
            <View className="items-center mb-2">
              <View className="w-10 h-1.5 rounded-full bg-white/25" />
            </View>
            <View className="flex-row items-center justify-between mb-2 rounded-xl">
              <Text className="text-base text-white">Comments</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-white/80">Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              refreshing={loading}
              renderItem={({ item }) => (
                <View className="py-2">
                  <View className="self-start max-w-[88%] px-3 py-2 rounded-2xl bg-white/12">
                    <Text className="text-white">{item.content}</Text>
                  </View>
                  <View className="flex-row items-center gap-4 mt-2">
                    <TouchableOpacity onPress={() => {
                      if (replyFor === item?.id) {
                        setReplyFor(null)
                        return
                      }
                      setReplyFor(item?.id)}
                    }>
                      <View className="flex-row items-center gap-1">
                        <Icon as={MessageCircle} size={12} color={'#ffffffcc'} />
                        <Text className="text-xs text-white/80">Reply</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center gap-1" onPress={() => toggleReplies(item.id)}>
                      <Icon as={repliesByParent[item.id] ? ChevronUp : ChevronDown} size={12} color={'#ffffff99'} />
                      <Text className="text-xs text-white/60">{repliesByParent[item.id] ? 'Hide replies' : 'View replies'}</Text>
                    </TouchableOpacity>
                    {loadingReplies[item.id] ? (<Text className="text-xs text-white/50">Loading…</Text>) : null}
                    <ReactionsChip
                      commentId={item.id}
                      countsByComment={countsByComment}
                      setCountsByComment={setCountsByComment}
                      selectedByComment={selectedByComment}
                      setSelectedByComment={setSelectedByComment}
                      pickerFor={pickerFor}
                      setPickerFor={setPickerFor}
                    />
                  </View>
                  {pickerFor === item.id && (
                    <BlurView intensity={30} tint="dark" className="self-start px-3 py-2 mt-2 rounded-full">
                      <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={async () => { await chooseReaction(item.id, 'like') }}><Text className="text-xl">👍</Text></TouchableOpacity>
                        <TouchableOpacity onPress={async () => { await chooseReaction(item.id, 'love') }}><Text className="text-xl">❤️</Text></TouchableOpacity>
                        <TouchableOpacity onPress={async () => { await chooseReaction(item.id, 'haha') }}><Text className="text-xl">😂</Text></TouchableOpacity>
                        <TouchableOpacity onPress={async () => { await chooseReaction(item.id, 'wow') }}><Text className="text-xl">😮</Text></TouchableOpacity>
                        <TouchableOpacity onPress={async () => { await chooseReaction(item.id, 'sad') }}><Text className="text-xl">😢</Text></TouchableOpacity>
                        <TouchableOpacity onPress={async () => { await chooseReaction(item.id, 'angry') }}><Text className="text-xl">😡</Text></TouchableOpacity>
                      </View>
                    </BlurView>
                  )}
                  
                  {repliesByParent[item.id]?.length ? (
                    <View className="pl-4 mt-1">
                      {repliesByParent[item.id].map((r) => {
                        console.log(JSON.stringify(repliesByParent[item.id]))
                        return (
                          <View key={r.id}>
                            <View className="self-start max-w-[88%] px-3 py-2 rounded-2xl bg-white/10">
                              <Text className="text-white/90">{r.content}</Text>
                            </View>
                            <View className="flex-row items-center gap-3 mt-1">
                              <ReactionsChip
                                commentId={r.id}
                                countsByComment={countsByComment}
                                setCountsByComment={setCountsByComment}
                                selectedByComment={selectedByComment}
                                setSelectedByComment={setSelectedByComment}
                                pickerFor={pickerFor}
                                setPickerFor={setPickerFor}
                              />
                            </View>
                            {pickerFor === r.id && (
                              <BlurView intensity={30} tint="dark" className="self-start px-3 py-2 mt-2 rounded-full">
                                <View className="flex-row items-center gap-3">
                                  <TouchableOpacity onPress={async () => { await chooseReaction(r.id, 'like') }}><Text className="text-xl">👍</Text></TouchableOpacity>
                                  <TouchableOpacity onPress={async () => { await chooseReaction(r.id, 'love') }}><Text className="text-xl">❤️</Text></TouchableOpacity>
                                  <TouchableOpacity onPress={async () => { await chooseReaction(r.id, 'haha') }}><Text className="text-xl">😂</Text></TouchableOpacity>
                                  <TouchableOpacity onPress={async () => { await chooseReaction(r.id, 'wow') }}><Text className="text-xl">😮</Text></TouchableOpacity>
                                  <TouchableOpacity onPress={async () => { await chooseReaction(r.id, 'sad') }}><Text className="text-xl">😢</Text></TouchableOpacity>
                                  <TouchableOpacity onPress={async () => { await chooseReaction(r.id, 'angry') }}><Text className="text-xl">😡</Text></TouchableOpacity>
                                </View>
                              </BlurView>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  ) : null}
                  {replyFor === item.id && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <TextInput
                        placeholder="Write a reply"
                        placeholderTextColor="#bbb"
                        value={replyText}
                        onChangeText={setReplyText}
                        className="flex-1 h-10 px-3 text-white rounded-xl bg-white/10"
                      />
                      <Button onPress={() => sendReply(item.id)} disabled={sending || !replyText.trim()} className="h-10 px-3">
                        {sending ? <Text>...</Text> : <Icon as={Send} size={16} color={'white'} />}
                      </Button>
                    </View>
                  )}
                </View>
              )}
              ListEmptyComponent={!loading ? <Text className="text-white/70">Be the first to comment</Text> : null}
              style={{ maxHeight: 280 }}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
            <View className="flex-row items-center gap-2 mt-2">
              <TextInput
                placeholder="Add a comment"
                placeholderTextColor="#bbb"
                value={text}
                onChangeText={setText}
                className="flex-1 px-3 text-white rounded-xl h-11 bg-white/10"
              />
              <Button onPress={send} disabled={sending || !text.trim()} className="px-3 h-11">
                {sending ? <Text>…</Text> : <Icon as={Send} size={18} color={'white'} />}
              </Button>
            </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export default ReelComments
