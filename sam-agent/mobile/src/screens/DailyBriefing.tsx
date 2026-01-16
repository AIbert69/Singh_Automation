/**
 * Daily Briefing Screen
 * Shows today's AI-generated briefing with top opportunities and strategic advice
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

import api, { Briefing, TopOpportunity } from '../services/api';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DailyBriefing() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const {
    data: briefing,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Briefing>({
    queryKey: ['briefing', 'today'],
    queryFn: () => api.getTodayBriefing(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading today's briefing...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load briefing'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#007AFF"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{briefing?.greeting || 'Good morning, Albert'}</Text>
        <Text style={styles.date}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{briefing?.summary}</Text>
      </View>

      {/* Stats */}
      {briefing?.stats && (
        <View style={styles.statsRow}>
          <StatCard label="Total" value={briefing.stats.total} color="#007AFF" />
          <StatCard label="Pursue" value={briefing.stats.pursue} color="#34C759" />
          <StatCard label="Review" value={briefing.stats.review} color="#FF9500" />
          <StatCard label="Avg Score" value={Math.round(briefing.stats.avg_score)} color="#5856D6" />
        </View>
      )}

      {/* Top Opportunities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Top Opportunities</Text>
        {briefing?.top_opportunities?.map((opp, index) => (
          <OpportunityCard key={index} opportunity={opp} />
        ))}
      </View>

      {/* Action Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Action Items</Text>
        {briefing?.action_items?.map((item, index) => (
          <View key={index} style={styles.actionItem}>
            <Text style={styles.actionBullet}>•</Text>
            <Text style={styles.actionText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Strategic Advice */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Strategic Advice</Text>
        <View style={styles.adviceCard}>
          <Text style={styles.adviceText}>{briefing?.strategic_advice}</Text>
        </View>
      </View>

      {/* Sam's Insight */}
      {briefing?.insight && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔮 Sam's Insight</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>{briefing.insight}</Text>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Opportunity Card Component
function OpportunityCard({ opportunity }: { opportunity: TopOpportunity }) {
  return (
    <View style={styles.opportunityCard}>
      <View style={styles.opportunityHeader}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{opportunity.fit_score}</Text>
        </View>
        <View style={styles.opportunityInfo}>
          <Text style={styles.opportunityTitle} numberOfLines={2}>
            {opportunity.title}
          </Text>
          <Text style={styles.opportunityAgency}>{opportunity.agency}</Text>
        </View>
      </View>
      <View style={styles.opportunityMeta}>
        <Text style={styles.metaText}>💰 {opportunity.value}</Text>
        <Text style={styles.metaText}>📅 {opportunity.due_date}</Text>
      </View>
      <Text style={styles.whyPursue}>{opportunity.why_pursue}</Text>
      <View style={styles.actionBox}>
        <Text style={styles.actionLabel}>ACTION:</Text>
        <Text style={styles.actionContent}>{opportunity.action}</Text>
      </View>
    </View>
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  opportunityCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  opportunityHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  opportunityAgency: {
    fontSize: 14,
    color: '#8E8E93',
  },
  opportunityMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 16,
  },
  whyPursue: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionBox: {
    backgroundColor: '#2a2a4a',
    padding: 12,
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  actionContent: {
    fontSize: 14,
    color: '#fff',
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionBullet: {
    color: '#007AFF',
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  adviceCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  adviceText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  insightCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5856D6',
  },
  insightText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 40,
  },
});
