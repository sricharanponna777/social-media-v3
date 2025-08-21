// components/CountryCodePicker.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { CountryCodeOptions } from '@/constants';

interface CountryCodePickerProps {
  value: number | null;
  onChange: (value: number) => void;
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({ value, onChange }) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedLabel = CountryCodeOptions.find((c) => c.value === value?.toString())?.label ?? 'Select Country Code';

  return (
    <>
      <TouchableOpacity
        className="border border-gray-300 p-3 rounded-lg mb-3 bg-white"
        onPress={() => setIsVisible(true)}
      >
        <Text className="text-base text-gray-800">
          {value ? `+${value}` : selectedLabel}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        
        <View className="flex-1 pt-15 px-4 bg-white">
          <Text className="text-xl mb-3 font-bold">Choose Country Code</Text>

          <FlatList
            data={CountryCodeOptions}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-4 border-b border-gray-200"
                onPress={() => {
                  onChange(parseInt(item.value));
                  setIsVisible(false);
                }}
              >
                <Text>{`${item.label}`}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
};
