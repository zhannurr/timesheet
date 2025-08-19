import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  visible: boolean;
  onClose: () => void;
}

export default function ThemeToggle({ visible, onClose }: ThemeToggleProps) {
  const { theme, themeMode, setThemeMode } = useTheme();

  const themeOptions = [
    { key: 'light', label: 'Light', description: 'Always use light theme' },
    { key: 'dark', label: 'Dark', description: 'Always use dark theme' },
    { key: 'system', label: 'System', description: 'Follow system settings' },
  ] as const;

  const handleThemeSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modal, { backgroundColor: theme.modal }]}>
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Choose Theme
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.option,
                  themeMode === option.key && {
                    backgroundColor: theme.primary + '20',
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => handleThemeSelect(option.key)}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
                {themeMode === option.key && (
                  <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
