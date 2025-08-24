import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/button';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import apiService from '@/lib/api';

export default function CreateStoryScreen() {
  // CHANGE 1: Update state to hold the base64 string
  const [media, setMedia] = useState<{ uri: string, type: 'image' | 'video', base64: string | null, mime: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [captionInputFocused, setCaptionInputFocused] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
      base64: true, // This is correct, we need the base64 data
    });

    // CHANGE 2: Store the base64 data and remove the unused FormData code
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        base64: asset.base64 !== undefined ? asset.base64 : null, // Store the base64 string in our state
        mime: asset.mimeType !== undefined ? asset.mimeType : ''
      });
    }
  };

  const createStory = async () => {
    if (!media || !media.base64) {
      return Alert.alert('Error', 'Please select an image or video to upload.');
    }

    setUploading(true);

    try {
      // CHANGE 3: Send the correct payload to the backend
      // We send `mediaBase64` instead of `mediaUrl`
      // We don't need to send `expires_at` as the backend calculates it
      await apiService.createStory({
        mediaBase64: media.base64,
        mediaType: media.type,
        caption,
        mimeType: media.mime
      });

      Alert.alert('Success', 'Your story has been created!');
      router.replace('/(main)/(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to create story.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className='flex-1 gap-5 px-6 py-12'>
      <Text className='text-2xl font-bold text-black dark:text-white'>Create Story</Text>
      {!captionInputFocused && (
        <Button onPress={pickMedia}>Pick Image or Video</Button>
      )}
      {/* Use a more robust check for media object before trying to access its properties */}
      {(!captionInputFocused && media) && (
        <View className='h-[200]'>
          {media.type === 'image' ? (
            <Image source={{ uri: media.uri }} style={{ width: '100%', height: 200 }} />
          ) : (
            <Text>Video selected: {media.uri.split('/').pop()}</Text>
          )}
        </View>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TextInput
          placeholder="Write a Caption... "
          value={caption}
          onChangeText={setCaption}
          onFocus={() => {
            setCaptionInputFocused(true);
          }}
          onBlur={() => {
            setCaptionInputFocused(false);
          }}
          className={`px-7 pb-[7] rounded-full h-14 bg-[#F2F2F7] dark:bg-[#1C1C1E] text-black dark:text-white text-lg`}
        />
      </KeyboardAvoidingView>
      <Button
        className={`w-full h-12`}
        onPress={createStory}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Create Story'}
      </Button>
    </View>
  );
}