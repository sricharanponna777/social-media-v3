import React, { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import { View } from '@/components/ui/view'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ActionSheet } from '@/components/ui/action-sheet'
import apiService, { Visibility } from '@/lib/api'
import { useRouter } from 'expo-router'

export default function CreatePost() {
  const router = useRouter();
  const [tabsValue, setTabsValue] = useState('public')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)
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
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Create Post</Text>

      {/* Media Picker */}
      <View style={styles.section}>
        <Button onPress={() => setIsVisible(true)} style={styles.button}>
          Add Media
        </Button>

        {/* Media Preview */}
        {media.length > 0 && (
          <>
            <View style={styles.mediaPreview}>
              {media.map((item, index) => (
                <Image
                  key={index}
                  source={{ uri: item.uri }}
                  style={styles.mediaImage}
                />
              ))}
            </View>

            {/* Clear Media Button */}
            <Button
              onPress={handleClearMedia}
              variant="outline"
              style={[styles.button, { marginTop: 12 }]}
            >
              Clear Media
            </Button>
          </>
        )}

        <ActionSheet
          visible={isVisible}
          onClose={() => setIsVisible(false)}
          title="Choose an action"
          message="Select one of the options below"
          options={[
            {
              title: 'Select Photos/Videos',
              onPress: () => {
                handlePickMedia()
                setIsVisible(false)
              },
            },
            {
              title: 'Take Photos/Videos',
              onPress: () => {
                handleTakeMedia()
                setIsVisible(false)
              },
            },
          ]}
        />
      </View>

      {/* Caption Input */}
      <View style={styles.section}>
        <Input
          placeholder="Write a caption..."
          value={caption}
          onChangeText={setCaption}
        />
      </View>

      {/* Visibility Tabs */}
      <View style={[styles.section, { alignItems: 'center' }]}>
        <Text style={styles.subTitle}>Visibility</Text>
        <Tabs defaultValue={tabsValue} onValueChange={setTabsValue}>
          <TabsList style={{ width: '100%' }}>
            <TabsTrigger value="public">Public</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      {/* Create Button */}
      <View style={styles.footer}>
        <Button
          onPress={handleCreatePost}
          disabled={createPostDisabled || loading}
          style={styles.button}
        >
          {loading ? 'Posting...' : 'Create Post'}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  section: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  button: {
    width: 333,
    height: 48,
  },
  mediaPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
})
