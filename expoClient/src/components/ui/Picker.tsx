import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  options: PickerOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof Feather.glyphMap;
}

export function Picker({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select...',
  icon,
}: PickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
      >
        <BlurView intensity={10} style={styles.blurBackground} />
        
        <View style={styles.triggerContent}>
          {icon && (
            <Feather name={icon} size={16} color="rgba(255, 255, 255, 0.7)" style={styles.icon} />
          )}
          <ThemedText style={styles.triggerText}>
            {selectedOption?.label || placeholder}
          </ThemedText>
          <Feather name="chevron-down" size={16} color="rgba(255, 255, 255, 0.7)" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdown}>
            <BlurView intensity={20} style={styles.dropdownBlur} />
            <View style={styles.dropdownContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      selectedValue === option.value && styles.selectedOption,
                    ]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        selectedValue === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                    {selectedValue === option.value && (
                      <Feather name="check" size={16} color="#8A2BE2" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    overflow: 'hidden',
    minHeight: 48,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  icon: {
    marginRight: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdown: {
    width: '100%',
    maxWidth: 300,
    maxHeight: 300,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  dropdownBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdownContent: {
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    padding: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  optionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
});
