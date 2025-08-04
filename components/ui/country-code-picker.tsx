// components/CountryCodePicker.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
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
        style={styles.selector}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.selectorText}>
          {value ? `+${value}` : selectedLabel}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Choose Country Code</Text>

          <FlatList
            data={CountryCodeOptions}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
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

const styles = StyleSheet.create({
  selector: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  countryItem: {
    paddingVertical: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
