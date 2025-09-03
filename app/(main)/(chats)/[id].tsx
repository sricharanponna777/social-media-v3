import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity as Button, Animated } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'
import { Input as TextInput } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import { ArrowLeft, Send } from 'lucide-react-native'
import apiService from '@/lib/api'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  message_type?: 'text' | 'image' | 'video' | 'file' | 'audio'
  media_url?: string | null
  created_at: string
  sender_username?: string
  sender_full_name?: string
}

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const conversationId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id])
  const router = useRouter()
  const { joinConversation, onNewMessage, sendMessage, typingStart, typingStop, onTypingStatus } = useSocket()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [headerTitle, setHeaderTitle] = useState<string>('Chat')
  const [conversationType, setConversationType] = useState<'private' | 'group' | undefined>(undefined)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const keyboardOffset = Platform.select({ ios: 62, android: 0 });
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current
  const animatingRef = useRef(false)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    try {
      const data: any = await apiService.getMessages(conversationId, 1, 50)
      if (Array.isArray(data)) {
        // Backward compatibility: older backend returns array
        setMessages(data as Message[])
      } else {
        setMessages((data.messages || []) as Message[])
        const convo = data.conversation
        if (convo) {
          if (convo.type === 'private' && convo.other_user) {
            setHeaderTitle('@' + convo.other_user.username || 'Chat')
          } else if (convo.title) {
            setHeaderTitle(convo.title)
          } else if (convo.type === 'group') {
            setHeaderTitle(convo.title || 'Group Chat')
          }
          setConversationType(convo.type as 'private' | 'group')
        }
      }
    } catch (e) {
      console.error('Failed to load messages', e)
    }
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return
    joinConversation(conversationId)
    fetchMessages()

    const offNewMessage = onNewMessage((msg: Message) => {
      if (msg.conversation_id === conversationId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    const offTyping = onTypingStatus(({ conversationId: cId, isTyping }) => {
      if (cId === conversationId) setIsTyping(isTyping)
    })

    return () => {
      offNewMessage()
      offTyping()
    }
  }, [conversationId, fetchMessages, joinConversation, onNewMessage, onTypingStatus])

  // Animated typing indicator (three dots)
  useEffect(() => {
    const animate = () => {
      if (!animatingRef.current) return
      Animated.parallel([
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0.2, duration: 220, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.delay(140),
          Animated.timing(dot2, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.2, duration: 220, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.delay(280),
          Animated.timing(dot3, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.2, duration: 220, useNativeDriver: true })
        ])
      ]).start(({ finished }) => {
        if (finished && animatingRef.current) animate()
      })
    }

    if (isTyping) {
      animatingRef.current = true
      dot1.setValue(0.2); dot2.setValue(0.2); dot3.setValue(0.2)
      animate()
    } else {
      animatingRef.current = false
      dot1.stopAnimation(); dot2.stopAnimation(); dot3.stopAnimation()
      dot1.setValue(0); dot2.setValue(0); dot3.setValue(0)
    }
    return () => {
      animatingRef.current = false
      dot1.stopAnimation(); dot2.stopAnimation(); dot3.stopAnimation()
    }
  }, [isTyping, dot1, dot2, dot3])

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || !conversationId) return
    setInput('')
    try {
      // Send over socket for realtime
      sendMessage({ conversationId, content })
    } catch (e) {
      console.error('Failed to send message', e)
    }
  }, [conversationId, input, sendMessage])

  const handleTyping = useCallback(
    (text: string) => {
      setInput(text)
      if (!conversationId) return
      typingStart(conversationId)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => typingStop(conversationId), 1000)
    },
    [conversationId, typingStart, typingStop]
  )

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isMine = user?.id && item.sender_id === user.id
    const isGroup = conversationType === 'group'
    const topMarginClass = item.sender_username ? 'mt-2' : 'mt-0.5'
    return (
      <View className={`${topMarginClass} mb-1`}>
        {isGroup && !isMine && item.sender_username ? (
          <Text className="mb-0.5 ml-1 text-xs opacity-70 text-foreground">@{item.sender_username}</Text>
        ) : null}
        <View className={`px-4 py-2 ${isMine ? 'self-end bg-green-500 rounded-2xl' : 'self-start bg-gray-200 dark:bg-gray-800 rounded-2xl'}`}>
          <Text className={`${isMine ? 'text-white' : 'text-foreground'}`}>{item.message}</Text>
        </View>
      </View>
    )
  }, [conversationType, user?.id])

  return (
    <View className={'flex-1'}>
      <View className="flex-row items-center p-3 border-b border-gray-200 dark:border-gray-800">
        <Button onPress={() => router.back()} className="p-2 mr-2">
          <Icon as={ArrowLeft} size={22} />
        </Button>
        <Text className="text-lg font-semibold text-foreground">{headerTitle}</Text>
      </View>
      <View className="flex-1 p-3">
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
        {isTyping && (
          <View className="flex-row items-center px-2 py-1">
            <Animated.View style={{ opacity: dot1 }} className="w-2 h-2 mx-0.5 rounded-full bg-foreground" />
            <Animated.View style={{ opacity: dot2 }} className="w-2 h-2 mx-0.5 rounded-full bg-foreground" />
            <Animated.View style={{ opacity: dot3 }} className="w-2 h-2 mx-0.5 rounded-full bg-foreground" />
          </View>
        )}
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardOffset}>
        <View className="flex-row items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-800">
          <TextInput
            placeholder="Message"
            value={input}
            onChangeText={handleTyping}
            returnKeyType="send"
            className="flex-1"
            autoComplete='off'
        />
        <Button onPress={handleSend} className="items-center justify-center w-12 h-12 bg-green-500 rounded-full">
          <Icon as={Send} size={20} color={'white'} />
        </Button>
      </View>
    </KeyboardAvoidingView>
    </View>
  ) 
}
