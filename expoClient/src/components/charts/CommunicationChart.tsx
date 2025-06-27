import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';

interface TimelinePoint {
  timestamp: number;
  value: number; // -1 to 1 range
  type: 'positive' | 'negative' | 'passive' | 'neutral';
}

interface CommunicationChartProps {
  data: TimelinePoint[];
  loading: boolean;
}

const CommunicationChart = ({ data, loading }: CommunicationChartProps) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const chartHeight = 160;
  const padding = { left: 40, right: 20, top: 20, bottom: 30 };

  // Format time in MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get point color based on type
  const getPointColor = (type: string): string => {
    switch (type) {
      case 'positive':
        return '#22c55e';
      case 'negative':
        return '#ef4444';
      case 'passive':
        return '#f59e0b';
      default:
        return 'rgba(255, 255, 255, 0.7)';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Communication Analysis</Text>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSkeleton} />
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Communication Analysis</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No analysis data available</Text>
        </View>
      </View>
    );
  }

  const maxTime = data[data.length - 1]?.timestamp || 60;
  const drawWidth = chartWidth - padding.left - padding.right;
  const drawHeight = chartHeight - padding.top - padding.bottom;

  // Map data points to SVG coordinates
  const points = data.map(point => ({
    x: padding.left + (point.timestamp / maxTime) * drawWidth,
    y: padding.top + ((1 - point.value) / 2) * drawHeight, // Map -1..1 to drawHeight..0
    type: point.type,
    value: point.value,
    timestamp: point.timestamp,
  }));

  // Create path for the line
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Communication Analysis</Text>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Reference lines */}
          <Line
            x1={padding.left}
            y1={padding.top + drawHeight * 0.25}
            x2={chartWidth - padding.right}
            y2={padding.top + drawHeight * 0.25}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
          <Line
            x1={padding.left}
            y1={padding.top + drawHeight * 0.5}
            x2={chartWidth - padding.right}
            y2={padding.top + drawHeight * 0.5}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
          <Line
            x1={padding.left}
            y1={padding.top + drawHeight * 0.75}
            x2={chartWidth - padding.right}
            y2={padding.top + drawHeight * 0.75}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />

          {/* Main line */}
          {points.length > 1 && (
            <Line
              x1={points[0].x}
              y1={points[0].y}
              x2={points[points.length - 1].x}
              y2={points[points.length - 1].y}
              stroke="#60a5fa"
              strokeWidth="2"
            />
          )}

          {/* Data points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={getPointColor(point.type)}
            />
          ))}

          {/* Y-axis labels */}
          <SvgText
            x="8"
            y={padding.top + drawHeight * 0.25 - 4}
            fontSize="10"
            fill="#22c55e"
          >
            Positive
          </SvgText>
          <SvgText
            x="8"
            y={padding.top + drawHeight * 0.5 + 3}
            fontSize="10"
            fill="rgba(255, 255, 255, 0.7)"
          >
            Neutral
          </SvgText>
          <SvgText
            x="8"
            y={padding.top + drawHeight * 0.75 + 10}
            fontSize="10"
            fill="#ef4444"
          >
            Negative
          </SvgText>

          {/* X-axis time labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <SvgText
              key={index}
              x={padding.left + ratio * drawWidth - 10}
              y={chartHeight - 8}
              fontSize="10"
              fill="rgba(255, 255, 255, 0.6)"
            >
              {formatTime(maxTime * ratio)}
            </SvgText>
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSkeleton: {
    width: '100%',
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  emptyContainer: {
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});

export default CommunicationChart;
