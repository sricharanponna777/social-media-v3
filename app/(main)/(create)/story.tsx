import React, { useEffect, useState } from 'react'
import { Alert, Linking, Platform, View, Text, TextInput, TouchableOpacity, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { VideoView } from 'expo-video'
import apiService from '@/lib/api'
import { useRouter } from 'expo-router'

export default function CreateStory() {
  const router = useRouter()
  const [caption, setCaption] = useState('')
  const [media, setMedia] = useState<any | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [loading, setLoading] = useState(false)

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

  const pickMedia = async () => {
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
          name: type === 'image' ? 'story.jpg' : 'story.mp4',
          type: mimeType,
        } as any)
        const res =
          type === 'image'
            ? await apiService.uploadImage(formData)
            : await apiService.uploadVideo(formData)
        setMedia(asset)
        setMediaUrl(res.url)
        setMediaType(type)
      }
    } catch (error) {
      console.error('Media picking error:', error)
    }
  }

  const handleCreateStory = async () => {
    if (!mediaUrl || !mediaType) {
      Alert.alert('Story Incomplete', 'Please add media before posting.')
      return
    }
    setLoading(true)
    try {
      await apiService.createStory({
        mediaUrl,
        mediaType,
        caption,
      })
      setCaption('')
      setMedia(null)
      setMediaUrl('')
      setMediaType(null)
      Alert.alert('Success', 'Story added!', [
        {
          text: 'OK',
          onPress: () => router.push('/feed'),
        },
      ])
    } catch (error) {
      console.error('Story creation failed:', error)
      Alert.alert('Failed', 'Could not create story.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 px-6 py-12">
      <Text className="mb-6 text-2xl font-bold">Create Story</Text>
      {media && (
        <View className="mb-6" style={{ width: '100%', height: 300 }}>
          {mediaType === 'image' ? (
            <Image source={{ uri: media.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <VideoView source={{ uri: media.uri }} style={{ width: '100%', height: '100%' }} />
          )}
        </View>
      )}
      <TextInput
        placeholder="Say something..."
        value={caption}
        onChangeText={setCaption}
        className="p-2 mb-6 border rounded-lg"
      />
      <TouchableOpacity onPress={pickMedia} className="w-[333px] h-12 mb-4 bg-blue-500 rounded-lg items-center justify-center">
        <Text className="text-white">Add Media</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleCreateStory}
        className="w-[333px] h-12 bg-green-500 rounded-lg items-center justify-center"
        disabled={!mediaUrl || loading}
      >
        <Text className="text-white">Share Story</Text>
      </TouchableOpacity>
    </View>
  )
}
