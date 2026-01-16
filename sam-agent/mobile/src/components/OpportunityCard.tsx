/**
 * Opportunity Card Component
 * Reusable card for displaying opportunity summaries
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';

import { Opportunity } from '../services/api';
import ScoreBadge from './ScoreBadge';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onPress?: () => void;
  compact?: boolean;
}

export default function OpportunityCard({
  opportunity,
  onPress,
  compact = false,
}: OpportunityCardProps) {
  const formatValue = (value?: number) => {
    if (!value) return 'TBD';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No due date';
    try {
      return format(new Date(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'pursue':
        return '#34C759';
      case 'review':
        return '#FF9500';
      case 'watch':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <ScoreBadge score={opportunity.fit_score} size="small" />
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {opportunity.title}
          </Text>
          <Text style={styles.compactMeta}>
            {opportunity.agency} • {formatValue(opportunity.estimated_value)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <ScoreBadge score={opportunity.fit_score} size="medium" />
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {opportunity.title}
          </Text>
          <Text style={styles.agency}>{opportunity.agency || 'Unknown Agency'}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Value</Text>
          <Text style={styles.metaValue}>
            {formatValue(opportunity.estimated_value)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Due</Text>
          <Text style={styles.metaValue}>{formatDate(opportunity.due_date)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Action</Text>
          <Text
            style={[
              styles.metaValue,
              {
                color: getRecommendationColor(
                  opportunity.strategic_recommendation
                ),
              },
            ]}
          >
            {opportunity.strategic_recommendation?.toUpperCase() || 'REVIEW'}
          </Text>
        </View>
      </View>

      {opportunity.set_aside && (
        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{opportunity.set_aside}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  agency: {
    fontSize: 14,
    color: '#8E8E93',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#34C759' + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#34C759',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  compactMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
