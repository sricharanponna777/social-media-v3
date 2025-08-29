import React, { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  Platform,
  View
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import apiService, { Visibility } from '@/lib/api'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'

export default function CreatePost() {
  const router = useRouter();
  const [tabsValue, setTabsValue] = useState('public')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [createPostDisabled, setCreatePostDisabled] = useState(false)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  useEffect(() => {
    checkPermissions()
  }, [])

  useEffect(() => {
    if (mediaUrls.length > 5) {
      setCreatePostDisabled(true)
    }
  }, [mediaUrls])

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

  const handleCreatePost = async () => {
    if (!caption) {
      Alert.alert('Post Incomplete', 'Please add a caption before posting.')
      return
    }

    console.log(`caption: ${caption}, mediaUrls: ${mediaUrls}, tabsValue: ${tabsValue}`)

    try {
      await apiService.createPost({
        caption,
        media: mediaUrls,
        visibility: tabsValue as Visibility,
      })
      console.log('Post created successfully')
      
    } catch (error) {
      console.error('Post creation failed:', error)
      Alert.alert('Post Creation Failed', 'Please try again.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setCaption('')
      setMedia([])
      setMediaUrls([])
      setTabsValue('public')
      Alert.alert('Success', 'Post created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.push('/feed')
          },
        },
      ])
    }, 1500)
  }

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        console.log(result.assets[0])
        const mediaType = result.assets[0].type === 'image' ? 'image' : 'video'
        const mimeType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4'
        const formData = new FormData()
        formData.append(mediaType, {
          uri: result.assets[0].uri,
          name: mediaType === 'image' ? 'content.jpg' : 'content.mp4',
          type: mimeType,
        } as any)
        if (mediaType === 'image') {
          const res = await apiService.uploadImage(formData)
          setMediaUrls((prev) => [...prev, res.url])
          console.log(mediaUrls)
        }
        if (mediaType === 'video') {
          const res = await apiService.uploadVideo(formData)
          setMediaUrls((prev) => [...prev, res.url])
          console.log(mediaUrls)
        }
        setMedia((prev) => [...prev, ...result.assets])
      }
    } catch (error) {
      console.error('Media picking error:', error)
    }
  }

  const handleTakeMedia = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      })

      if (!result.canceled) {
        console.log(result.assets[0])
        const mediaType = result.assets[0].type === 'image' ? 'image' : 'video'
        const mimeType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4'
        const formData = new FormData()
        formData.append(mediaType, {
          uri: result.assets[0].uri,
          name: mediaType === 'image' ? 'content.jpg' : 'content.mp4',
          type: mimeType,
        } as any)
        if (mediaType === 'image') {
          const res = await apiService.uploadImage(formData)
          setMediaUrls((prev) => [...prev, res.url])
          console.log(mediaUrls)
        }
        if (mediaType === 'video') {
          const res = await apiService.uploadVideo(formData)
          setMediaUrls((prev) => [...prev, res.url])
          console.log(mediaUrls)
        }
        setMedia((prev) => [...prev, ...result.assets])
      }
    } catch (error) {
      console.error('Camera error:', error)
    }
  }

  const handleClearMedia = () => {
    setMedia([])
    setMediaUrls([])
  }

  return (
    <View className="flex-1 gap-6 px-6 py-12">
      {/* Title */}
      <Text className="text-2xl font-bold text-black dark:text-white">Create Post</Text>

      {/* Media Picker */}
        <View>
          <Button
            onPress={() =>
              Alert.alert(
                'Choose an action',
                'Select one of the options below',
                [
                  {
                    text: 'Select Photos/Videos',
                    onPress: handlePickMedia,
                  },
                  {
                    text: 'Take Photos/Videos',
                    onPress: handleTakeMedia,
                  },
                  { text: 'Cancel', style: 'cancel' },
                ],
              )
            }
            className="w-full h-12"
          >
            <Text>Add Media</Text>
          </Button>

        {/* Media Preview */}
        {media.length > 0 && (
          <>
            <View className="flex-row flex-wrap gap-2.5 mt-3">
              {media.map((item, index) => (
                <Image
                  key={index}
                  source={{ uri: item.uri }}
                  className="w-20 h-20 rounded-lg"
                />
              ))}
            </View>

            {/* Clear Media Button */}
            <Button
              onPress={handleClearMedia}
              variant="outline"
              className="w-[333px] h-12 mt-3"
            >
              <Text>Clear Media</Text>
            </Button>
          </>
        )}
      </View>

      {/* Caption Input */}
      <View>
        <Input
          placeholder="Write a caption..."
          value={caption}
          onChangeText={setCaption}
        />
      </View>

      {/* Visibility Tabs */}
      <View className="items-center">
        <Text className="mb-3 text-base font-bold text-black dark:text-white">Visibility</Text>
        <Tabs value={tabsValue} onValueChange={setTabsValue}>
          <TabsList>
            <TabsTrigger value="public"><Text>Public</Text></TabsTrigger>
            <TabsTrigger value="friends"><Text>Friends</Text></TabsTrigger>
            <TabsTrigger value="private"><Text>Private</Text></TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      {/* Create Button */}
      <View className="items-center">
        <Button
          onPress={handleCreatePost}
          disabled={createPostDisabled || loading}
          className="w-full h-12"
        >
          <Text>{loading ? 'Posting...' : 'Create Post'}</Text>
        </Button>
      </View>
    </View>
  )
}
