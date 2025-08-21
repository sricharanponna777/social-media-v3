import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CORNERS, FONT_SIZE } from '@/theme/globals';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { LucideProps, Video, X } from 'lucide-react-native';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  View as RNView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

export type MediaType = 'image' | 'video' | 'all';
export type MediaQuality = 'low' | 'medium' | 'high';

export interface MediaAsset {
  id: string;
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  filename?: string;
  fileSize?: number;
}

export interface MediaPickerProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: React.ComponentType<LucideProps>;
  disabled?: boolean;
  mediaType?: MediaType;
  multiple?: boolean;
  maxSelection?: number;
  quality?: MediaQuality;
  buttonText?: string;
  placeholder?: string;
  gallery?: boolean;
  showPreview?: boolean;
  previewSize?: number;
  selectedAssets?: MediaAsset[];
  onSelectionChange?: (assets: MediaAsset[]) => void;
  onError?: (error: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

// Helper function to compare arrays of MediaAssets
const arraysEqual = (a: MediaAsset[], b: MediaAsset[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const bItem = b[index];
    return (
      item.id === bItem.id && item.uri === bItem.uri && item.type === bItem.type
    );
  });
};

export const MediaPicker = forwardRef<RNView, MediaPickerProps>(
  (
    {
      children,
      mediaType = 'all',
      multiple = false,
      gallery = false,
      maxSelection = 10,
      quality = 'high',
      onSelectionChange,
      onError,
      buttonText,
      showPreview = true,
      previewSize = 80,
      style,
      variant,
      size,
      icon,
      disabled = false,
      selectedAssets = [],
    },
    ref
  ) => {
    const [assets, setAssets] = useState<MediaAsset[]>(selectedAssets);
    const [isGalleryVisible, setIsGalleryVisible] = useState(false);
    const [galleryAssets, setGalleryAssets] = useState<MediaLibrary.Asset[]>(
      []
    );
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    // Use ref to track previous selectedAssets to avoid unnecessary updates
    const prevSelectedAssetsRef = useRef<MediaAsset[]>(selectedAssets);

    // Theme colors
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({}, 'mutedForeground');
    const primaryColor = useThemeColor({}, 'primary');
    const secondary = useThemeColor({}, 'secondary');

    // Request permissions on mount
    useEffect(() => {
      requestPermissions();
    }, []);

    // Update internal state when selectedAssets prop changes (with proper comparison)
    useEffect(() => {
      // Only update if the arrays are actually different
      if (!arraysEqual(prevSelectedAssetsRef.current, selectedAssets)) {
        setAssets(selectedAssets);
        prevSelectedAssetsRef.current = selectedAssets;
      }
    }, [selectedAssets]);

    const requestPermissions = async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');

        if (status !== 'granted') {
          onError?.(
            'Media library permission is required to access photos and videos'
          );
        }
      } catch (error) {
        onError?.('Failed to request permissions');
        setHasPermission(false);
      }
    };

    const loadGalleryAssets = async () => {
      if (!hasPermission) return;

      try {
        const mediaTypeFilter =
          mediaType === 'image'
            ? [MediaLibrary.MediaType.photo]
            : mediaType === 'video'
            ? [MediaLibrary.MediaType.video]
            : [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video];

        const { assets: galleryAssets } = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: mediaTypeFilter,
          sortBy: MediaLibrary.SortBy.creationTime,
        });

        setGalleryAssets(galleryAssets);
      } catch (error) {
        onError?.('Failed to load gallery assets');
      }
    };

    const pickFromGallery = async () => {
      if (!hasPermission) {
        await requestPermissions();
        return;
      }

      if (gallery) {
        await loadGalleryAssets();
        setIsGalleryVisible(true);
        return;
      }

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            mediaType === 'image'
              ? ImagePicker.MediaTypeOptions.Images
              : mediaType === 'video'
              ? ImagePicker.MediaTypeOptions.Videos
              : ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: multiple,
          quality: quality === 'high' ? 1 : quality === 'medium' ? 0.7 : 0.3,
          selectionLimit: multiple ? maxSelection : 1,
        });

        if (!result.canceled && result.assets) {
          const newAssets = result.assets.map((asset, index) => ({
            id: `gallery_${Date.now()}_${index}`,
            uri: asset.uri,
            type:
              asset.type === 'video' ? ('video' as const) : ('image' as const),
            width: asset.width,
            height: asset.height,
            duration: asset.duration || undefined,
            filename: asset.fileName || undefined,
            fileSize: asset.fileSize,
          }));

          handleAssetSelection(newAssets);
        }
      } catch (error) {
        onError?.('Failed to pick media from gallery');
      }
    };

    const handleAssetSelection = (newAssets: MediaAsset[]) => {
      let updatedAssets: MediaAsset[];

      if (multiple) {
        updatedAssets = [...assets, ...newAssets].slice(0, maxSelection);
      } else {
        updatedAssets = newAssets;
      }

      setAssets(updatedAssets);
      prevSelectedAssetsRef.current = updatedAssets; // Update ref to prevent loop
      onSelectionChange?.(updatedAssets);
    };

    const handleGalleryAssetSelect = async (
      galleryAsset: MediaLibrary.Asset
    ) => {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(galleryAsset);

        const newAsset: MediaAsset = {
          id: galleryAsset.id,
          uri: assetInfo.localUri || galleryAsset.uri,
          type:
            galleryAsset.mediaType === MediaLibrary.MediaType.video
              ? 'video'
              : 'image',
          width: galleryAsset.width,
          height: galleryAsset.height,
          duration: galleryAsset.duration || undefined,
          filename: galleryAsset.filename,
        };

        if (multiple) {
          const isAlreadySelected = assets.some(
            (asset) => asset.id === newAsset.id
          );
          if (isAlreadySelected) {
            const filteredAssets = assets.filter(
              (asset) => asset.id !== newAsset.id
            );
            setAssets(filteredAssets);
            prevSelectedAssetsRef.current = filteredAssets; // Update ref
            onSelectionChange?.(filteredAssets);
          } else if (assets.length < maxSelection) {
            const updatedAssets = [...assets, newAsset];
            setAssets(updatedAssets);
            prevSelectedAssetsRef.current = updatedAssets; // Update ref
            onSelectionChange?.(updatedAssets);
          }
        } else {
          const newAssets = [newAsset];
          setAssets(newAssets);
          prevSelectedAssetsRef.current = newAssets; // Update ref
          onSelectionChange?.(newAssets);
          setIsGalleryVisible(false);
        }
      } catch (error) {
        onError?.('Failed to select asset');
      }
    };

    const removeAsset = (assetId: string) => {
      const filteredAssets = assets.filter((asset) => asset.id !== assetId);
      setAssets(filteredAssets);
      prevSelectedAssetsRef.current = filteredAssets; // Update ref
      onSelectionChange?.(filteredAssets);
    };

    const renderPreviewItem = ({ item }: { item: MediaAsset }) => (
      <View style={{ borderColor }} className="mx-1 rounded-lg border overflow-hidden relative">
        <ExpoImage
          source={{ uri: item.uri }}
          style={{ width: previewSize, height: previewSize }}
          className="rounded-lg"
          contentFit='cover'
        />
        {item.type === 'video' && (
          <View className="absolute top-2 left-2 bg-black/60 rounded-full p-1">
            <Video size={16} color='white' />
          </View>
        )}
        <TouchableOpacity
          style={{ backgroundColor: primaryColor }}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full items-center justify-center"
          onPress={() => removeAsset(item.id)}
        >
          <X size={12} color={secondary} />
        </TouchableOpacity>
      </View>
    );

    const renderGalleryItem = ({ item }: { item: MediaLibrary.Asset }) => {
      const isSelected = assets.some((asset) => asset.id === item.id);
      const itemWidth = screenWidth / 3 - 4;

      return (
        <Pressable
          style={[
            { width: itemWidth, height: itemWidth },
            isSelected && { borderColor: primaryColor, borderWidth: 3 },
          ]}
          className="m-px rounded-md overflow-hidden relative"
          onPress={() => handleGalleryAssetSelect(item)}
        >
          <ExpoImage
            source={{ uri: item.uri }}
            className="w-full h-full"
            contentFit='cover'
          />
          {item.mediaType === MediaLibrary.MediaType.video && (
            <View className="absolute top-2 left-2 bg-black/60 rounded-full p-1">
              <Video size={20} color='white' />
            </View>
          )}
          {multiple && isSelected && (
            <View
              style={{ backgroundColor: primaryColor }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center"
            >
              <Text
                style={{
                  color: secondary,
                }}
                className="text-xs font-bold"
              >
                {assets.findIndex((asset) => asset.id === item.id) + 1}
              </Text>
            </View>
          )}
        </Pressable>
      );
    };

    return (
      <View ref={ref} style={style}>
        {children ? (
          children
        ) : (
          <Button
            onPress={pickFromGallery}
            disabled={disabled}
            variant={variant}
            size={size}
            icon={icon}
          >
            {buttonText ||
              `Select ${
                mediaType === 'all'
                  ? 'Media'
                  : mediaType === 'image'
                  ? 'Images'
                  : 'Videos'
              }`}
          </Button>
        )}

        {showPreview && assets.length > 0 && (
          <FlatList
            data={assets}
            renderItem={renderPreviewItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{paddingHorizontal: 4}}
          />
        )}

        {gallery && (
          <Modal
            visible={isGalleryVisible}
            animationType='slide'
            presentationStyle='pageSheet'
          >
            <View
              style={{ backgroundColor: cardColor }}
              className="flex-1"
            >
              <View
                style={{ borderBottomColor: borderColor }}
                className="flex-row justify-between items-center p-4 border-b"
              >
                <Text variant='title'>
                  {buttonText ||
                    `Select ${
                      mediaType === 'all'
                        ? 'Media'
                        : mediaType === 'image'
                        ? 'Images'
                        : 'Videos'
                    }`}
                </Text>
                <View className="flex-row items-center gap-4">
                  {multiple && (
                    <Text
                      style={{ color: mutedColor }}
                      className="text-base font-medium"
                    >
                      {assets.length}/{maxSelection}
                    </Text>
                  )}

                  <Button
                    size='sm'
                    variant='success'
                    onPress={() => setIsGalleryVisible(false)}
                  >
                    Done
                  </Button>
                </View>
              </View>

              <FlatList
                data={galleryAssets}
                renderItem={renderGalleryItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={{padding: 2}}
              />
            </View>
          </Modal>
        )}
      </View>
    );
  }
);

MediaPicker.displayName = 'MediaPicker';
