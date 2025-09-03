import React, { useEffect, useState } from 'react'
import { Alert, Image, Linking, Platform, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as VideoThumbnails from 'expo-video-thumbnails'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import apiService from '@/lib/api'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'
import { API_URL } from '@/constants'

export default function CreateReel() {
  const router = useRouter()
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [video, setVideo] = useState<{ uri: string; duration?: number } | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [serverThumbnail, setServerThumbnail] = useState<string | null>(null)
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null)
  const [localThumbnailUri, setLocalThumbnailUri] = useState<string | null>(null)

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    if (Platform.OS !== 'web') {
      try {
        const { status: mediaStatus } = await ImagePicker.getMediaLibraryPermissionsAsync()
        if (mediaStatus !== 'granted') {
          const { status: newMediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (newMediaStatus !== 'granted') {
            Alert.alert(
              'Permission Required',
              'We need camera roll permissions to upload media. Please enable it in your settings.',
              [
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
              ]
            )
          }
        }
        const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync()
        if (cameraStatus !== 'granted') {
          await ImagePicker.requestCameraPermissionsAsync()
        }
      } catch (err) {
        console.error('Permission check failed:', err)
      }
    }
  }

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      })
      if (!result.canceled) {
        const asset = result.assets[0]
        setVideo({ uri: asset.uri, duration: asset.duration })
        const formData = new FormData()
        formData.append('video', {
          // @ts-ignore
          uri: asset.uri,
          name: 'reel.mp4',
          type: 'video/mp4',
        })
        const res = await apiService.uploadVideo(formData)
        setVideoUrl(res.url)

        // Try client-side thumbnail generation and upload
        try {
          const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 })
          if (thumb?.uri) {
            // show local thumbnail immediately
            setLocalThumbnailUri(thumb.uri)
            const thumbForm = new FormData()
            thumbForm.append('image', {
              // @ts-ignore RN FormData file
              uri: thumb.uri,
              name: 'thumbnail.jpg',
              type: 'image/jpeg',
            })
            const tRes = await apiService.uploadImage(thumbForm)
            setGeneratedThumbnailUrl(tRes.url)
          }
        } catch (e) {
          console.warn('Thumbnail generation failed', e)
        }
      }
    } catch (e) {
      console.error('Video pick error', e)
    }
  }

  const handleRecordVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      })
      if (!result.canceled) {
        const asset = result.assets[0]
        setVideo({ uri: asset.uri, duration: asset.duration })
        const formData = new FormData()
        formData.append('video', {
          // @ts-ignore
          uri: asset.uri,
          name: 'reel.mp4',
          type: 'video/mp4',
        })
        const res = await apiService.uploadVideo(formData)
        setVideoUrl(res.url)

        // Try client-side thumbnail generation and upload
        try {
          const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 })
          if (thumb?.uri) {
            // show local thumbnail immediately
            setLocalThumbnailUri(thumb.uri)
            const thumbForm = new FormData()
            thumbForm.append('image', {
              // @ts-ignore RN FormData file
              uri: thumb.uri,
              name: 'thumbnail.jpg',
              type: 'image/jpeg',
            })
            const tRes = await apiService.uploadImage(thumbForm)
            setGeneratedThumbnailUrl(tRes.url)
          }
        } catch (e) {
          console.warn('Thumbnail generation failed', e)
        }
      }
    } catch (e) {
      console.error('Video record error', e)
    }
  }

  const handleCreateReel = async () => {
    if (!videoUrl) {
      Alert.alert('Missing video', 'Please pick or record a video.')
      return
    }
    try {
      setLoading(true)
      const created = await apiService.createReel({
        media_url: videoUrl,
        thumbnail_url: generatedThumbnailUrl || null,
        duration: video?.duration ? Math.round(video.duration) : null,
        caption: caption || null,
      })
      setLoading(false)
      // If backend generated a thumbnail, show it right away
      if (created?.thumbnail_url) {
        setServerThumbnail(created.thumbnail_url)
      }
      Alert.alert('Success', 'Reel created! Thumbnail generated.', [
        { text: 'View Reels', onPress: () => router.replace('/(main)/(tabs)/reels') },
        { text: 'Stay', style: 'cancel' }
      ])
    } catch (e) {
      setLoading(false)
      console.error('Create reel failed', e)
      Alert.alert('Error', 'Failed to create reel')
    }
  }

  return (
    <View className="flex-1 gap-6 px-6 py-12">
      <Text className="text-2xl font-bold text-black dark:text-white">Create Reel</Text>

      <View>
        <Button
          onPress={() =>
            Alert.alert('Choose an action', 'Select one of the options below', [
              { text: 'Select Video', onPress: handlePickVideo },
              { text: 'Record Video', onPress: handleRecordVideo },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          className="w-full h-12"
        >
          <Text>{videoUrl ? 'Replace Video' : 'Add Video'}</Text>
        </Button>
        {(serverThumbnail || localThumbnailUri || generatedThumbnailUrl) && (
          <View className="mt-3">
            <Image
              source={{
                uri:
                  serverThumbnail ||
                  (localThumbnailUri as string) ||
                  (generatedThumbnailUrl && (generatedThumbnailUrl.startsWith('http') ? generatedThumbnailUrl : `${API_URL}${generatedThumbnailUrl}`)) ||
                  undefined,
              }}
              className="w-full h-64 rounded-xl"
            />
            <Text className="mt-2 text-xs text-foreground">
              {video?.duration ? `${Math.round((video.duration || 0))}s` : (serverThumbnail || generatedThumbnailUrl || localThumbnailUri) ? 'Thumbnail ready' : ''}
            </Text>
          </View>
        )}
      </View>

      <View>
        <Input placeholder="Write a caption..." value={caption} onChangeText={setCaption} />
      </View>

      <View className="items-center">
        <Button onPress={handleCreateReel} disabled={!videoUrl || loading} className="w-full h-12">
          <Text>{loading ? 'Posting…' : 'Create Reel'}</Text>
        </Button>
      </View>
    </View>
  )
}
