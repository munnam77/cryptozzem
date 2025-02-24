import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ApiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Clipboard } from 'react-native';

export function PremiumFeaturesScreen() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<{ requestsRemaining: number; resetTime: Date } | null>(null);
  const { user } = useAuth();
  const apiService = ApiService.getInstance();

  useEffect(() => {
    if (user) {
      loadApiUsage();
    }
  }, [user]);

  const loadApiUsage = async () => {
    try {
      const usage = await apiService.getUsage(user!.id);
      setUsage(usage);
    } catch (error) {
      console.error('Failed to load API usage:', error);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setIsLoading(true);
      const key = await apiService.getApiKey(user!.id);
      setApiKey(key);
    } catch (error) {
      console.error('Failed to generate API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeKey = async () => {
    try {
      setIsLoading(true);
      await apiService.revokeApiKey(user!.id);
      setApiKey(null);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (apiKey) {
      Clipboard.setString(apiKey);
    }
  };

  const limits = user ? apiService.getLimits(user.role) : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>API Access</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0284c7" />
        ) : (
          <>
            {apiKey ? (
              <View style={styles.apiKeyContainer}>
                <Text style={styles.label}>Your API Key:</Text>
                <Text style={styles.apiKey}>{apiKey}</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={handleCopyKey} style={[styles.button, styles.copyButton]}>
                    <Text style={styles.buttonText}>Copy Key</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRevokeKey} style={[styles.button, styles.revokeButton]}>
                    <Text style={styles.buttonText}>Revoke Key</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={handleGenerateKey} style={styles.button}>
                <Text style={styles.buttonText}>Generate API Key</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Usage & Limits</Text>
        {usage && limits && (
          <>
            <View style={styles.limitRow}>
              <Text style={styles.label}>Requests Remaining:</Text>
              <Text style={styles.value}>{usage.requestsRemaining}</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.label}>Reset Time:</Text>
              <Text style={styles.value}>{new Date(usage.resetTime).toLocaleString()}</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.label}>Historical Data:</Text>
              <Text style={styles.value}>{limits.historicalDataDays} days</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.label}>Custom Indicators:</Text>
              <Text style={styles.value}>{limits.customIndicators ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.label}>Real-time Updates:</Text>
              <Text style={styles.value}>{limits.realTimeUpdates ? 'Yes' : 'No'}</Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  apiKeyContainer: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  apiKey: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  copyButton: {
    backgroundColor: '#059669',
  },
  revokeButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
});