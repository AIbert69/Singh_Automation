/**
 * Action Button Component
 * Standardized action buttons for opportunities
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

type ActionType = 'pursue' | 'review' | 'bookmark' | 'pass' | 'primary' | 'secondary';

interface ActionButtonProps {
  type: ActionType;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function ActionButton({
  type,
  label,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ActionButtonProps) {
  const getTypeStyles = (type: ActionType) => {
    switch (type) {
      case 'pursue':
        return {
          backgroundColor: '#34C759',
          textColor: '#fff',
        };
      case 'review':
        return {
          backgroundColor: '#FF9500',
          textColor: '#fff',
        };
      case 'bookmark':
        return {
          backgroundColor: '#5856D6',
          textColor: '#fff',
        };
      case 'pass':
        return {
          backgroundColor: '#8E8E93',
          textColor: '#fff',
        };
      case 'primary':
        return {
          backgroundColor: '#007AFF',
          textColor: '#fff',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          textColor: '#007AFF',
          borderColor: '#007AFF',
        };
      default:
        return {
          backgroundColor: '#2a2a4a',
          textColor: '#fff',
        };
    }
  };

  const typeStyles = getTypeStyles(type);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: typeStyles.backgroundColor },
        typeStyles.borderColor && {
          borderWidth: 1,
          borderColor: typeStyles.borderColor,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          { color: typeStyles.textColor },
          isDisabled && styles.disabledText,
        ]}
      >
        {loading ? 'Loading...' : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
