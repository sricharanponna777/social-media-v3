import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, useWindowDimensions, ActivityIndicator, Keyboard } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { BlurView } from 'expo-blur'
import apiService from '@/lib/api'
import { Icon } from '@/components/ui/icon'
import { ThumbsUp, MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react-native'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

type Comment = {
  id: string
  content: string
  created_at?: string
}

interface PostCommentsProps {
  postId: string
  visible: boolean
  onClose: () => void
  onAdded?: () => void
}

const PostComments: React.FC<PostCommentsProps> = ({ postId, visible, onClose, onAdded }) => {
  type reactions = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
  const reactionMap: Record<reactions, string> = {
    like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡'
  }
  const [comments, setComments] = useState<Comment[]>([])
  const [repliesByParent, setRepliesByParent] = useState<Record<string, Comment[]>>({})
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const { height: screenH } = useWindowDimensions()
  const sheetHeight = Math.min(Math.max(screenH * 0.68, 360), 580)
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [countsByComment, setCountsByComment] = useState<Record<string, Record<string, number>>>({})
  const [selectedByComment, setSelectedByComment] = useState<Record<string, 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'>>({})
  const [kVisible, setKVisible] = useState(false)
  const [kbHeight, setKbHeight] = useState(0)
  const replyInputRef = useRef<TextInput | null>(null)
  const [ownTypeByComment, setOwnTypeByComment] = useState<Record<string, 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null>>({})
  const { user } = useAuth()
  const userId = (user as any)?.id as string | undefined
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
  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getPostComments(postId, 1, 50).catch(() => ({ comments: [] as Comment[] }))
      const items: Comment[] = Array.isArray(data) ? data : (Array.isArray((data as any)?.comments) ? (data as any).comments : [])
      setComments(items)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    if (visible) load()
  }, [visible, load])

  // Keyboard listeners to improve layout when typing
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const onShow = (e: any) => {
      setKVisible(true)
      const h = e?.endCoordinates?.height ?? 0
      setKbHeight(h)
    }
    const onHide = () => {
      setKVisible(false)
      setKbHeight(0)
    }
    const sub1 = Keyboard.addListener(showEvt as any, onShow)
    const sub2 = Keyboard.addListener(hideEvt as any, onHide)
    return () => {
      sub1.remove(); sub2.remove()
    }
  }, [])

  const dynamicHeight = useMemo(() => {
    if (!kVisible) return sheetHeight
    const available = Math.max(320, screenH - kbHeight - 24)
    return Math.min(sheetHeight, available)
  }, [kVisible, sheetHeight, screenH, kbHeight])

  // Hydrate reaction data for top-level comments on initial render/display
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

  useEffect(() => {
    console.log('countsByComment', ( JSON.stringify(countsByComment)))
    console.log('ownTypeByComment', ownTypeByComment)
  }, [ownTypeByComment, countsByComment])

  const send = async () => {
    if (!text.trim()) return
    try {
      setSending(true)
      await apiService.commentOnPost(postId, text.trim())
      const newItem: Comment = { id: Math.random().toString(36).slice(2), content: text.trim() }
      setComments((prev) => [newItem, ...prev])
      setText('')
      onAdded?.()
    } finally {
      setSending(false)
    }
  }

  const toggleReplies = async (parentId: string) => {
    const isOpen = Array.isArray(repliesByParent[parentId])
    if (isOpen) {
      setRepliesByParent((m) => { const { [parentId]:_, ...rest } = m; return rest })
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
    console.log(parentId)
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

  const totalFor = useCallback((commentId: string) => {
    const map = countsByComment[commentId] || {}
    return Object.values(map).reduce((a, b) => a + b, 0)
  }, [countsByComment])

  const refreshCounts = useCallback(async (commentId: string) => {
    try {
      const res = await apiService.getReactions('comment', commentId)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setCountsByComment((m) => ({ ...m, [commentId]: map }))
    } catch {}
  }, [])

  const quickToggle = useCallback(async (commentId: string) => {
    try {
      await ensureCounts(commentId)
      const mine = ownTypeByComment[commentId]
      if (!mine) {
        await chooseReaction(commentId, 'like')
      } else if (mine === 'like') {
        await apiService.removeReaction('comment', commentId)
        setOwnTypeByComment((m) => ({ ...m, [commentId]: null }))
        await refreshCounts(commentId)
      } else {
        await chooseReaction(commentId, 'like')
      }
    } catch {}
  }, [ensureCounts, ownTypeByComment, chooseReaction, refreshCounts])
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="justify-end flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ height: dynamicHeight }} className="overflow-hidden rounded-t-2xl">
            {/* Android readability fallback under blur */}
            <View style={{ ...Platform.select({ android: { backgroundColor: 'rgba(18,18,18,0.92)' } }) }} className="absolute inset-0" />
            <BlurView intensity={40} tint="dark" className="absolute inset-0" />

            <View className="flex-1 p-3">
              <View className="items-center mb-2">
                <View className="w-10 h-1.5 rounded-full bg-white/25" />
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base text-white">Comments</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text className="text-white/80">Close</Text>
                </TouchableOpacity>
              </View>

              {loading && comments.length === 0 ? (
                <View className="items-center justify-center flex-1">
                  <ActivityIndicator />
                </View>
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={(item) => item.id}
                  refreshing={loading}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <View className="py-2">
                      <View className="self-start max-w-[88%] px-3 py-2 rounded-2xl bg-white/12">
                        <Text className="text-sm text-white">{item.content}</Text>
                      </View>
                      <View className="flex-row items-center gap-4 mt-2">
                        <TouchableOpacity onPress={() => { setReplyFor(item.id); setTimeout(() => replyInputRef.current?.focus(), 50) }}>
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
                        <TouchableOpacity
                          className="flex-row items-center gap-1"
                          onPress={() => quickToggle(item.id)}
                          onLongPress={async () => { await ensureCounts(item.id); setPickerFor(item.id) }}
                          activeOpacity={0.7}
                        >
                          {!ownTypeByComment[item.id] && <Icon as={ThumbsUp} size={20} color={'white'} />}
                          {ownTypeByComment[item.id] && <Text>{reactionMap[ownTypeByComment[item.id]]}</Text>}
                          <Text className="text-xs text-white/80">{totalFor(item.id)}</Text>
                        </TouchableOpacity>
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
                            console.log(JSON.stringify(r))
                            return (
                            <View key={r.id}>
                              <View className="self-start max-w-[88%] px-3 py-2 rounded-2xl">
                                <Text className="text-white/90 text-[13px]">{r.content}</Text>
                              </View>
                              <View className="flex-row items-center gap-3 mt-1">
                                <TouchableOpacity
                                  className="flex-row items-center gap-1"
                                  onPress={() => quickToggle(r.id)}
                                  onLongPress={async () => { await ensureCounts(r.id); setPickerFor(r.id) }}
                                  activeOpacity={0.7}
                                >
                                  {!ownTypeByComment[r.id] && <Icon as={ThumbsUp} size={14} color={'white'} />}
                                  {ownTypeByComment[r.id] && <Text>{reactionMap[ownTypeByComment[r.id]]}</Text>}
                                  <Text className="text-xs text-white/70">{totalFor(r.id)}</Text>
                                </TouchableOpacity>
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
                          )})}
                        </View>
                      ) : null}
                      {replyFor === item.id && (
                        <View className="flex-row items-center gap-2 mt-2">
                          <TextInput
                            placeholder="Write a reply"
                            placeholderTextColor="#bbb"
                            value={replyText}
                            onChangeText={setReplyText}
                            ref={(el) => { if (replyFor === item.id) replyInputRef.current = el }}
                            returnKeyType="send"
                            onSubmitEditing={() => sendReply(item.id)}
                            className="flex-1 h-10 px-3 text-white rounded-xl bg-white/12"
                          />
                          <Button onPress={() => sendReply(item.id)} disabled={sending || !replyText.trim()} className="h-10 px-3">
                            {sending ? <Text>...</Text> : <Icon as={Send} size={16} color={'white'} />}
                          </Button>
                        </View>
                      )}
                      <View className="h-px mt-2 bg-white/10" />
                    </View>
                  )}
                  contentContainerStyle={{ paddingBottom: 8, flexGrow: 1 }}
                  ListEmptyComponent={!loading ? (
                    <View className="items-center justify-center flex-1 py-10">
                      <Text className="text-white/70">Be the first to comment</Text>
                    </View>
                  ) : null}
                />
              )}

              <View className="flex-row items-center gap-2 mt-2">
                <TextInput
                  placeholder="Add a comment"
                  placeholderTextColor="#bbb"
                  value={text}
                  onChangeText={setText}
                  returnKeyType="send"
                  onSubmitEditing={send}
                  className="flex-1 px-3 text-white h-11 rounded-xl bg-white/12"
                />
                <Button onPress={send} disabled={sending || !text.trim()} className="px-3 h-11">
                  {sending ? <Text>…</Text> : <Icon as={Send} size={18} className='text-background' />}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export default PostComments
