/**
 * Score Badge Component
 * Displays opportunity fit score with color coding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export default function ScoreBadge({ score, size = 'medium' }: ScoreBadgeProps) {
  const getColor = (score: number): string => {
    if (score >= 70) return '#34C759'; // Green - Highly qualified
    if (score >= 50) return '#30D158'; // Light green - Pursue
    if (score >= 25) return '#FF9500'; // Orange - Review
    return '#8E8E93'; // Gray - Watch
  };

  const getLabel = (score: number): string => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Low';
  };

  const sizeStyles = {
    small: {
      container: { width: 36, height: 36, borderRadius: 18 },
      score: { fontSize: 14 },
      label: { display: 'none' as const },
    },
    medium: {
      container: { width: 48, height: 48, borderRadius: 24 },
      score: { fontSize: 18 },
      label: { display: 'none' as const },
    },
    large: {
      container: { width: 80, height: 80, borderRadius: 40 },
      score: { fontSize: 28 },
      label: { display: 'flex' as const, fontSize: 12 },
    },
  };

  const color = getColor(score);
  const label = getLabel(score);
  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor: color + '20', borderColor: color },
      ]}
    >
      <Text style={[styles.score, currentSize.score, { color }]}>
        {score}
      </Text>
      {size === 'large' && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  score: {
    fontWeight: 'bold',
  },
  label: {
    marginTop: 2,
  },
});
