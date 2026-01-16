/**
 * Settings Screen
 * App settings and preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';

import api from '../services/api';
import useNotifications from '../hooks/useNotifications';

export default function Settings() {
  const { settings, updateSettings } = useNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.enabled);
  const [highScoreAlerts, setHighScoreAlerts] = useState(settings.highScoreAlerts);

  const scanMutation = useMutation({
    mutationFn: () => api.triggerScan(),
    onSuccess: () => {
      Alert.alert('Scan Started', 'A new scan has been triggered. Check back in a few minutes.');
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to trigger scan');
    },
  });

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await updateSettings({ enabled: value });
  };

  const handleHighScoreAlertsToggle = async (value: boolean) => {
    setHighScoreAlerts(value);
    await updateSettings({ highScoreAlerts: value });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Company Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Profile</Text>
        <View style={styles.infoCard}>
          <Text style={styles.companyName}>Singh Automation LLC</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CAGE</Text>
            <Text style={styles.infoValue}>86VF7</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>UEI</Text>
            <Text style={styles.infoValue}>GJ1DPYQ3X8K5</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SAM Status</Text>
            <Text style={[styles.infoValue, styles.activeStatus]}>Active</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary NAICS</Text>
            <Text style={styles.infoValue}>333249</Text>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Briefing</Text>
            <Text style={styles.settingDescription}>
              Get your briefing every morning at 7 AM
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#2a2a4a', true: '#34C759' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>High-Score Alerts</Text>
            <Text style={styles.settingDescription}>
              Notify when opportunities score 70+
            </Text>
          </View>
          <Switch
            value={highScoreAlerts}
            onValueChange={handleHighScoreAlertsToggle}
            trackColor={{ false: '#2a2a4a', true: '#34C759' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Data Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>

        <View style={styles.sourceItem}>
          <Text style={styles.sourceName}>SAM.gov</Text>
          <Text style={styles.sourceStatus}>✓ Active</Text>
        </View>
        <View style={styles.sourceItem}>
          <Text style={styles.sourceName}>DIBBS (DLA)</Text>
          <Text style={styles.sourceStatus}>✓ Active</Text>
        </View>
        <View style={styles.sourceItem}>
          <Text style={styles.sourceName}>USASpending</Text>
          <Text style={styles.sourceStatus}>✓ Active</Text>
        </View>
        <View style={styles.sourceItem}>
          <Text style={styles.sourceName}>Michigan MITN</Text>
          <Text style={styles.sourceStatus}>✓ Active</Text>
        </View>
        <View style={styles.sourceItem}>
          <Text style={styles.sourceName}>California eProcure</Text>
          <Text style={styles.sourceStatus}>✓ Active</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
        >
          <Text style={styles.actionButtonText}>
            {scanMutation.isPending ? 'Scanning...' : '🔄 Trigger Manual Scan'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📊 Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🔧 Edit Company Profile</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Sam Agent 2.0</Text>
          <Text style={styles.aboutVersion}>Version 2.0.0</Text>
          <Text style={styles.aboutDescription}>
            Your autonomous government contracting advisor.
            Powered by Claude AI.
          </Text>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  activeStatus: {
    color: '#34C759',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  sourceName: {
    fontSize: 16,
    color: '#fff',
  },
  sourceStatus: {
    fontSize: 14,
    color: '#34C759',
  },
  actionButton: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
