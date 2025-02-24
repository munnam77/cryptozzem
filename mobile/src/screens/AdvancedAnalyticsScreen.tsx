import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { AdvancedAnalyticsService } from '../services/advancedAnalyticsService';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { DataTable } from 'react-native-paper';

interface AnalyticsData {
  marketAnalysis: MarketAnalysis;
  patterns: {
    pattern: string;
    probability: number;
    priceTarget: number;
    timeframe: string;
  }[];
  indicators: TechnicalIndicator[];
}

export function AdvancedAnalyticsScreen({ route }) {
  const { symbol } = route.params;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const analyticsService = AdvancedAnalyticsService.getInstance();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadAnalytics();
  }, [symbol]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [marketAnalysis, patterns, indicators] = await Promise.all([
        analyticsService.getMarketAnalysis(symbol),
        analyticsService.getAdvancedPatterns(symbol),
        analyticsService.getCustomIndicators(symbol, '1h', user!.role)
      ]);

      setData({ marketAnalysis, patterns, indicators });
    } catch (error) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load data'}</Text>
      </View>
    );
  }

  const { marketAnalysis, patterns, indicators } = data;

  const sentimentData = {
    labels: ['Overall', 'Social', 'News', 'Technical'],
    datasets: [{
      data: [
        marketAnalysis.sentiment.overall,
        marketAnalysis.sentiment.social,
        marketAnalysis.sentiment.news,
        marketAnalysis.sentiment.technical
      ]
    }]
  };

  const volumeData = {
    labels: ['Current', '24h Change'],
    datasets: [{
      data: [
        marketAnalysis.volume.current,
        marketAnalysis.volume.change24h
      ]
    }]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Market Sentiment</Text>
        <LineChart
          data={sentimentData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Volume Analysis</Text>
        <BarChart
          data={volumeData}
          width={screenWidth - 32}
          height={220}
          yAxisSuffix="K"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          style={styles.chart}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Price Action</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Support</Text>
          <Text style={styles.value}>${marketAnalysis.priceAction.support.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Resistance</Text>
          <Text style={styles.value}>${marketAnalysis.priceAction.resistance.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Trend</Text>
          <Text style={styles.value}>{marketAnalysis.priceAction.trend}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Momentum</Text>
          <Text style={styles.value}>{marketAnalysis.priceAction.momentum.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Advanced Patterns</Text>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Pattern</DataTable.Title>
            <DataTable.Title numeric>Probability</DataTable.Title>
            <DataTable.Title numeric>Target</DataTable.Title>
          </DataTable.Header>

          {patterns.map((pattern, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell>{pattern.pattern}</DataTable.Cell>
              <DataTable.Cell numeric>{(pattern.probability * 100).toFixed(1)}%</DataTable.Cell>
              <DataTable.Cell numeric>${pattern.priceTarget.toFixed(2)}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Technical Indicators</Text>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Indicator</DataTable.Title>
            <DataTable.Title numeric>Value</DataTable.Title>
            <DataTable.Title>Signal</DataTable.Title>
          </DataTable.Header>

          {indicators.map((indicator, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell>{indicator.name}</DataTable.Cell>
              <DataTable.Cell numeric>{indicator.value.toFixed(2)}</DataTable.Cell>
              <DataTable.Cell>
                <Text style={[
                  styles.signal,
                  { color: indicator.signal === 'buy' ? '#059669' : 
                          indicator.signal === 'sell' ? '#dc2626' : '#64748b' }
                ]}>
                  {indicator.signal.toUpperCase()}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  signal: {
    fontWeight: '600',
  },
});