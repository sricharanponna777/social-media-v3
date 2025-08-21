import { useThemeColor } from '@/hooks/useThemeColor';
import { BORDER_RADIUS, CORNERS, FONT_SIZE, HEIGHT } from '@/theme/globals';
import { ChevronDown } from 'lucide-react-native';
import React, {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

// Context for sharing state between components
interface ComboboxContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value: string;
  setValue: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  triggerLayout: { x: number; y: number; width: number; height: number };
  setTriggerLayout: (layout: any) => void;
  disabled: boolean;
  multiple: boolean;
  values: string[];
  setValues: (values: string[]) => void;
  filteredItemsCount: number;
  setFilteredItemsCount: (count: number) => void;
}

const ComboboxContext = createContext<ComboboxContextType | undefined>(
  undefined
);

const useCombobox = () => {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error('Combobox components must be used within a Combobox');
  }
  return context;
};

// Main Combobox wrapper
interface ComboboxProps {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
}

export function Combobox({
  children,
  value = '',
  onValueChange,
  disabled = false,
  multiple = false,
  values = [],
  onValuesChange,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItemsCount, setFilteredItemsCount] = useState(0);
  const [triggerLayout, setTriggerLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const setValue = (newValue: string) => {
    if (multiple) {
      const newValues = values.includes(newValue)
        ? values.filter((v) => v !== newValue)
        : [...values, newValue];
      onValuesChange?.(newValues);
    } else {
      onValueChange?.(newValue);
    }
  };

  const setValues = (newValues: string[]) => {
    onValuesChange?.(newValues);
  };

  return (
    <ComboboxContext.Provider
      value={{
        isOpen,
        setIsOpen,
        value,
        setValue,
        searchQuery,
        setSearchQuery,
        triggerLayout,
        setTriggerLayout,
        disabled,
        multiple,
        values,
        setValues,
        filteredItemsCount,
        setFilteredItemsCount,
      }}
    >
      {children}
    </ComboboxContext.Provider>
  );
}

// Combobox Trigger
interface ComboboxTriggerProps {
  children: ReactNode;
  style?: ViewStyle;
  error?: boolean;
}

export function ComboboxTrigger({
  children,
  style,
  error = false,
}: ComboboxTriggerProps) {
  const { setIsOpen, setTriggerLayout, disabled, isOpen } = useCombobox();
  const triggerRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);

  const cardColor = useThemeColor({}, 'card');
  const destructiveColor = useThemeColor({}, 'destructive');
  const mutedColor = useThemeColor({}, 'textMuted');

  const measureTrigger = () => {
    if (triggerRef.current) {
      triggerRef.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          setTriggerLayout({ x: pageX, y: pageY, width, height });
        }
      );
    }
  };

  const handlePress = () => {
    if (disabled) return;
    measureTrigger();
    setIsOpen(true);
  };

  return (
    <TouchableOpacity
      ref={triggerRef}
      style={[
        {
          backgroundColor: cardColor,
          borderColor: error ? destructiveColor : cardColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      className="h-12 flex-row items-center justify-between px-4 rounded-lg border"
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View className="flex-1 flex-row items-center">{children}</View>
      <ChevronDown
        size={20}
        color={mutedColor}
        strokeWidth={2}
        style={[
          { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] },
        ]}
        className="ml-2"
      />
    </TouchableOpacity>
  );
}

// Combobox Value display
interface ComboboxValueProps {
  placeholder?: string;
  style?: TextStyle;
}

export function ComboboxValue({
  placeholder = 'Select...',
  style,
}: ComboboxValueProps) {
  const { value, values, multiple } = useCombobox();
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');

  const hasValue = multiple ? values.length > 0 : value;
  const displayText = multiple
    ? values.length === 0
      ? placeholder
      : values.length === 1
      ? values[0]
      : `${values.length} selected`
    : value || placeholder;

  return (
    <Text
      style={[
        {
          color: hasValue ? textColor : mutedColor,
        },
        style,
      ]}
      className="text-base flex-1"
      numberOfLines={1}
    >
      {displayText}
    </Text>
  );
}

// Combobox Content (Modal overlay)
interface ComboboxContentProps {
  children: ReactNode;
  maxHeight?: number;
}

export function ComboboxContent({
  children,
  maxHeight = 400,
}: ComboboxContentProps) {
  const { isOpen, setIsOpen, setSearchQuery, triggerLayout } = useCombobox();
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const screenHeight = Dimensions.get('window').height;
  const availableHeight =
    screenHeight - triggerLayout.y - triggerLayout.height - 100;
  const dropdownHeight = Math.min(maxHeight, availableHeight);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType='fade'
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/30" onPress={handleClose}>
        <View
          style={[
            {
              backgroundColor: cardColor,
              borderColor: borderColor,
              top: triggerLayout.y + triggerLayout.height + 6,
              left: triggerLayout.x,
              width: triggerLayout.width,
              maxHeight: dropdownHeight,
            },
          ]}
          className="absolute rounded-lg border shadow-lg"
        >
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

// Combobox Input for searching
interface ComboboxInputProps {
  placeholder?: string;
  style?: ViewStyle;
  autoFocus?: boolean;
}

export function ComboboxInput({
  placeholder = 'Search...',
  style,
  autoFocus = true,
}: ComboboxInputProps) {
  const { searchQuery, setSearchQuery } = useCombobox();
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View
      style={[
        { borderBottomColor: borderColor },
        style,
      ]}
      className="px-4 py-3 border-b h-12"
    >
      <TextInput
        style={{ color: textColor }}
        className="text-base flex-1"
        placeholder={placeholder}
        placeholderTextColor={mutedColor}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoFocus={autoFocus}
      />
    </View>
  );
}

// Combobox List wrapper
interface ComboboxListProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function ComboboxList({ children, style }: ComboboxListProps) {
  const { searchQuery, setFilteredItemsCount } = useCombobox();

  // Filter children based on search query
  const filteredChildren = Children.toArray(children).filter((child) => {
    if (!searchQuery) return true;

    if (isValidElement(child) && child.type === ComboboxItem) {
      const props = child.props as any;
      const searchText = props.searchValue || props.value || '';
      return searchText.toLowerCase().includes(searchQuery.toLowerCase());
    }

    if (isValidElement(child) && child.type === ComboboxGroup) {
      // For groups, check if any children match
      const groupProps = child.props as any;
      const groupChildren = Children.toArray(groupProps.children);

      return groupChildren.some((groupChild) => {
        if (isValidElement(groupChild) && groupChild.type === ComboboxItem) {
          const itemProps = groupChild.props as any;
          const searchText = itemProps.searchValue || itemProps.value || '';
          return searchText.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      });
    }

    return true;
  });

  // Count filtered items (excluding empty components)
  const countFilteredItems = (children: React.ReactNode[]): number => {
    return children.reduce<number>((count, child) => {
      if (isValidElement(child)) {
        if (child.type === ComboboxItem) {
          return count + 1;
        }
        if (child.type === ComboboxGroup) {
          const groupProps = child.props as any;
          const groupChildren = Children.toArray(groupProps.children);
          return count + countFilteredItems(groupChildren);
        }
      }
      return count;
    }, 0);
  };

  const itemCount = countFilteredItems(filteredChildren);

  // Update filtered items count in context
  useEffect(() => {
    setFilteredItemsCount(itemCount);
  }, [itemCount, setFilteredItemsCount]);

  return (
    <ScrollView
      style={style}
      className="max-h-[400px]"
      showsVerticalScrollIndicator={false}
    >
      {filteredChildren}
    </ScrollView>
  );
}

// Combobox Empty state
interface ComboboxEmptyProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function ComboboxEmpty({ children, style }: ComboboxEmptyProps) {
  const { searchQuery, filteredItemsCount } = useCombobox();
  const mutedColor = useThemeColor({}, 'textMuted');

  // Only show if there's a search query AND no filtered items
  if (!searchQuery || filteredItemsCount > 0) return null;

  return (
    <View style={style} className="p-4 items-center">
      {typeof children === 'string' ? (
        <Text style={{ color: mutedColor }} className="text-base italic">
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

// Combobox Group wrapper
interface ComboboxGroupProps {
  children: ReactNode;
  heading?: string;
}

export function ComboboxGroup({ children, heading }: ComboboxGroupProps) {
  const { searchQuery } = useCombobox();
  const mutedColor = useThemeColor({}, 'textMuted');

  // Filter children based on search query
  const filteredChildren = Children.toArray(children).filter((child) => {
    if (!searchQuery) return true;

    if (isValidElement(child) && child.type === ComboboxItem) {
      const props = child.props as any;
      const searchText = props.searchValue || props.value || '';
      return searchText.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  // Don't render group if no children match search
  if (searchQuery && filteredChildren.length === 0) return null;

  return (
    <View>
      {heading && (
        <Text style={{ color: mutedColor }} className="text-xs font-semibold px-4 py-2 uppercase tracking-wider">
          {heading}
        </Text>
      )}
      {filteredChildren}
    </View>
  );
}

// Combobox Item
interface ComboboxItemProps {
  children: ReactNode;
  value: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
  searchValue?: string;
  style?: ViewStyle;
}

export function ComboboxItem({
  children,
  value,
  onSelect,
  disabled = false,
  searchValue,
  style,
}: ComboboxItemProps) {
  const {
    setValue,
    setIsOpen,
    multiple,
    values,
    value: selectedValue,
  } = useCombobox();
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');

  const isSelected = multiple
    ? values.includes(value)
    : selectedValue === value;

  const handleSelect = () => {
    if (disabled) return;

    onSelect?.(value);
    setValue(value);

    if (!multiple) {
      setIsOpen(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: isSelected ? `${primaryColor}15` : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      className="flex-row items-center px-4 py-3 min-h-[44px]"
      onPress={handleSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text
          style={{
              color: textColor,
              fontWeight: isSelected ? '600' : '400',
            }}
          className="text-base flex-1"
        >
          {children}
        </Text>
      ) : (
        // Clone child elements and pass isSelected prop
        Children.map(children, (child) => {
          if (isValidElement(child)) {
            return cloneElement(child, { isSelected } as any);
          }
          return child;
        })
      )}
    </TouchableOpacity>
  );
}
