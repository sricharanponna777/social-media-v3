import React, { useState, useRef } from "react";
import { View, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

const { width } = Dimensions.get("window");

interface CarouselProps {
  data: any[];
  renderItem: ({ item, index, itemWidth }: { item: any; index: number; itemWidth: number }) => React.JSX.Element;
  itemWidth?: number;
  gap?: number;
  showDots?: boolean;
}

const Carousel = ({ data, renderItem, itemWidth = width, gap = 0, showDots = true }: CarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (itemWidth + gap));
    setActiveIndex(index);
  };

  return (
    <View className="w-full">
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={{ width: itemWidth, marginRight: gap }}>
            {renderItem({ item, index, itemWidth })}
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth + gap}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {showDots && (
        <View className="flex-row justify-center mt-2">
          {data.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${
                activeIndex === index ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default Carousel;