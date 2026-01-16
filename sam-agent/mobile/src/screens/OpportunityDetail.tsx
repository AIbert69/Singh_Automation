/**
 * Opportunity Detail Screen
 * Shows detailed information and AI analysis for a single opportunity
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

import api, { Opportunity, OpportunityAnalysis } from '../services/api';
import { RootStackParamList } from '../../App';
import ScoreBadge from '../components/ScoreBadge';

type OpportunityDetailRouteProp = RouteProp<RootStackParamList, 'OpportunityDetail'>;

export default function OpportunityDetail() {
  const route = useRoute<OpportunityDetailRouteProp>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const [showAnalysis, setShowAnalysis] = useState(false);

  // Fetch opportunity details
  const {
    data: opportunity,
    isLoading,
    isError,
  } = useQuery<Opportunity>({
    queryKey: ['opportunity', id],
    queryFn: () => api.getOpportunity(id),
  });

  // Fetch AI analysis (lazy)
  const {
    data: analysis,
    isLoading: analysisLoading,
    refetch: fetchAnalysis,
  } = useQuery<OpportunityAnalysis>({
    queryKey: ['opportunity-analysis', id],
    queryFn: () => api.analyzeOpportunity(id),
    enabled: showAnalysis,
  });

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: ({ actionType, notes }: { actionType: string; notes?: string }) =>
      api.recordAction(id, actionType, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      Alert.alert('Success', 'Action recorded');
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to record action');
    },
  });

  const handleAction = (actionType: string) => {
    Alert.alert(
      'Confirm Action',
      `Mark this opportunity as "${actionType}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => actionMutation.mutate({ actionType }),
        },
      ]
    );
  };

  const openUrl = () => {
    if (opportunity?.url) {
      Linking.openURL(opportunity.url);
    }
  };

  const handleAnalyze = () => {
    setShowAnalysis(true);
    fetchAnalysis();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (isError || !opportunity) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load opportunity</Text>
      </View>
    );
  }

  const formatValue = (value?: number) => {
    if (!value) return 'TBD';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified';
    try {
      return format(new Date(dateStr), 'MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ScoreBadge score={opportunity.fit_score} size="large" />
        <Text style={styles.title}>{opportunity.title}</Text>
        <Text style={styles.agency}>{opportunity.agency}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Value</Text>
          <Text style={styles.statValue}>{formatValue(opportunity.estimated_value)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Due Date</Text>
          <Text style={styles.statValue}>{formatDate(opportunity.due_date)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Source</Text>
          <Text style={styles.statValue}>{opportunity.source}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        {opportunity.set_aside && (
          <DetailRow label="Set-Aside" value={opportunity.set_aside} />
        )}
        {opportunity.naics_codes && opportunity.naics_codes.length > 0 && (
          <DetailRow label="NAICS" value={opportunity.naics_codes.join(', ')} />
        )}
        {opportunity.location && (
          <DetailRow label="Location" value={opportunity.location} />
        )}
        {opportunity.state && (
          <DetailRow label="State" value={opportunity.state} />
        )}
      </View>

      {/* Description */}
      {opportunity.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{opportunity.description}</Text>
        </View>
      )}

      {/* AI Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
          {!showAnalysis && (
            <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
              <Text style={styles.analyzeButtonText}>Analyze</Text>
            </TouchableOpacity>
          )}
        </View>

        {showAnalysis && (
          <>
            {analysisLoading ? (
              <View style={styles.analysisLoading}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.analysisLoadingText}>Analyzing with AI...</Text>
              </View>
            ) : analysis ? (
              <View style={styles.analysisContent}>
                <Text style={styles.analysisText}>{analysis.analysis}</Text>

                {analysis.strengths && analysis.strengths.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>✅ Strengths</Text>
                    {analysis.strengths.map((s, i) => (
                      <Text key={i} style={styles.analysisBullet}>• {s}</Text>
                    ))}
                  </View>
                )}

                {analysis.challenges && analysis.challenges.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>⚠️ Challenges</Text>
                    {analysis.challenges.map((c, i) => (
                      <Text key={i} style={styles.analysisBullet}>• {c}</Text>
                    ))}
                  </View>
                )}

                {analysis.action_items && analysis.action_items.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>📋 Action Items</Text>
                    {analysis.action_items.map((a, i) => (
                      <Text key={i} style={styles.analysisBullet}>• {a}</Text>
                    ))}
                  </View>
                )}
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.pursueButton]}
            onPress={() => handleAction('pursued')}
          >
            <Text style={styles.actionButtonText}>🎯 Pursue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.bookmarkButton]}
            onPress={() => handleAction('bookmarked')}
          >
            <Text style={styles.actionButtonText}>🔖 Bookmark</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => handleAction('passed')}
          >
            <Text style={styles.actionButtonText}>👎 Pass</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Original */}
      {opportunity.url && (
        <TouchableOpacity style={styles.viewOriginalButton} onPress={openUrl}>
          <Text style={styles.viewOriginalText}>View Original on {opportunity.source}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  agency: {
    fontSize: 16,
    color: '#8E8E93',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#1a1a2e',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    textAlign: 'right',
  },
  description: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  analysisLoadingText: {
    color: '#8E8E93',
    marginLeft: 12,
  },
  analysisContent: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
  },
  analysisText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 16,
  },
  analysisSection: {
    marginTop: 12,
  },
  analysisSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  analysisBullet: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 22,
    paddingLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pursueButton: {
    backgroundColor: '#34C759',
  },
  bookmarkButton: {
    backgroundColor: '#FF9500',
  },
  passButton: {
    backgroundColor: '#8E8E93',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewOriginalButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    alignItems: 'center',
  },
  viewOriginalText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});
