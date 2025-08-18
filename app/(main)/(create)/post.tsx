import React, { useEffect, useState } from 'react'
import { Alert, Image, Linking, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import apiService from '@/lib/api'
import { useRouter } from 'expo-router'

export default function CreatePost() {
  const router = useRouter()
  const [caption, setCaption] = useState('')
  const [media, setMedia] = useState<any[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: mediaStatus } = await ImagePicker.getMediaLibraryPermissionsAsync()
      if (mediaStatus !== 'granted') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'We need camera roll permissions to upload media.', [
            {
              text: 'Open Settings',
              onPress: async () => {
                if (Platform.OS === 'ios') {
                  await Linking.openURL('app-settings:')
                } else {
                  await Linking.openSettings()
                }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
      }

      const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync()
      if (cameraStatus !== 'granted') {
        await ImagePicker.requestCameraPermissionsAsync()
      }
    }
  }

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      })
      if (!result.canceled) {
        const asset = result.assets[0]
        const type = asset.type === 'image' ? 'image' : 'video'
        const mimeType = type === 'image' ? 'image/jpeg' : 'video/mp4'
        const formData = new FormData()
        formData.append(type, {
          uri: asset.uri,
          name: type === 'image' ? 'content.jpg' : 'content.mp4',
          type: mimeType,
        } as any)
        const res = type === 'image' ? await apiService.uploadImage(formData) : await apiService.uploadVideo(formData)
        setMedia((prev) => [...prev, asset])
        setMediaUrls((prev) => [...prev, res.url])
      }
    } catch (error) {
      console.error('Media picking error:', error)
    }
  }

  const handleCreatePost = async () => {
    if (!caption) {
      Alert.alert('Post Incomplete', 'Please add a caption before posting.')
      return
    }
    try {
      await apiService.createPost({
        caption,
        media: mediaUrls,
        visibility: 'public',
      })
      setCaption('')
      setMedia([])
      setMediaUrls([])
      Alert.alert('Success', 'Post created successfully!', [{
        text: 'OK',
        onPress: () => router.push('/feed'),
      }])
    } catch (error) {
      console.error('Post creation failed:', error)
      Alert.alert('Post Creation Failed', 'Please try again.')
    }
  }

  return (
    <View className="flex-1 px-6 py-12">
      <Text className="mb-6 text-2xl font-bold">Create Post</Text>
      <TextInput
        placeholder="Say something..."
        value={caption}
        onChangeText={setCaption}
        className="mb-6 border p-2 rounded-lg"
      />
      {media.map((m, idx) => (
        <Image key={idx} source={{ uri: m.uri }} style={{ width: '100%', height: 200, marginBottom: 8 }} />
      ))}
      <TouchableOpacity onPress={handlePickMedia} className="w-[333px] h-12 mb-4 bg-blue-500 rounded-lg items-center justify-center">
        <Text className="text-white">Add Media</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleCreatePost}
        className="w-[333px] h-12 bg-green-500 rounded-lg items-center justify-center"
        disabled={!caption}
      >
        <Text className="text-white">Share Post</Text>
      </TouchableOpacity>
    </View>
  )
}
