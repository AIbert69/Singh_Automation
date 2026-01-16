/**
 * Opportunities Screen
 * Lists all opportunities with filtering and sorting
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

import api, { Opportunity } from '../services/api';
import { RootStackParamList } from '../../App';
import ScoreBadge from '../components/ScoreBadge';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'pursue' | 'review' | 'watch';

export default function Opportunities() {
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const minScoreMap: Record<FilterType, number> = {
    all: 0,
    pursue: 50,
    review: 25,
    watch: 0,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['opportunities', filter],
    queryFn: () =>
      api.getOpportunities({
        min_score: minScoreMap[filter],
        limit: 100,
      }),
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const navigateToDetail = (id: string) => {
    navigation.navigate('OpportunityDetail', { id });
  };

  const filteredOpportunities = React.useMemo(() => {
    if (!data?.opportunities) return [];

    switch (filter) {
      case 'pursue':
        return data.opportunities.filter(o => o.fit_score >= 50);
      case 'review':
        return data.opportunities.filter(o => o.fit_score >= 25 && o.fit_score < 50);
      case 'watch':
        return data.opportunities.filter(o => o.fit_score < 25);
      default:
        return data.opportunities;
    }
  }, [data, filter]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading opportunities...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load opportunities'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterTab
          label="All"
          count={data?.opportunities?.length || 0}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterTab
          label="Pursue"
          count={data?.opportunities?.filter(o => o.fit_score >= 50).length || 0}
          active={filter === 'pursue'}
          color="#34C759"
          onPress={() => setFilter('pursue')}
        />
        <FilterTab
          label="Review"
          count={data?.opportunities?.filter(o => o.fit_score >= 25 && o.fit_score < 50).length || 0}
          active={filter === 'review'}
          color="#FF9500"
          onPress={() => setFilter('review')}
        />
        <FilterTab
          label="Watch"
          count={data?.opportunities?.filter(o => o.fit_score < 25).length || 0}
          active={filter === 'watch'}
          color="#8E8E93"
          onPress={() => setFilter('watch')}
        />
      </View>

      {/* Opportunities List */}
      <FlatList
        data={filteredOpportunities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OpportunityCard
            opportunity={item}
            onPress={() => navigateToDetail(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No opportunities found</Text>
          </View>
        }
      />
    </View>
  );
}

// Filter Tab Component
function FilterTab({
  label,
  count,
  active,
  color = '#007AFF',
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterTab,
        active && { backgroundColor: color + '20', borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterLabel,
          active && { color },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.filterCount,
          active && { color },
        ]}
      >
        {count}
      </Text>
    </TouchableOpacity>
  );
}

// Opportunity Card Component
function OpportunityCard({
  opportunity,
  onPress,
}: {
  opportunity: Opportunity;
  onPress: () => void;
}) {
  const formatValue = (value?: number) => {
    if (!value) return 'TBD';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No due date';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <TouchableOpacity style={styles.opportunityCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        <ScoreBadge score={opportunity.fit_score} size="medium" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {opportunity.title}
          </Text>
          <Text style={styles.cardAgency}>{opportunity.agency || 'Unknown Agency'}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Value</Text>
          <Text style={styles.metaValue}>{formatValue(opportunity.estimated_value)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Due</Text>
          <Text style={styles.metaValue}>{formatDate(opportunity.due_date)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Source</Text>
          <Text style={styles.metaValue}>{opportunity.source}</Text>
        </View>
      </View>

      {opportunity.set_aside && (
        <View style={styles.setAsideTag}>
          <Text style={styles.setAsideText}>{opportunity.set_aside}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1a1a2e',
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  opportunityCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardAgency: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cardMeta: {
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
  setAsideTag: {
    backgroundColor: '#34C759' + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  setAsideText: {
    fontSize: 12,
    color: '#34C759',
  },
});
