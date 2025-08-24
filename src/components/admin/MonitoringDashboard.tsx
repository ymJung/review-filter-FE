'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { logger } from '@/lib/monitoring/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    openai: 'healthy' | 'unhealthy' | 'not_configured';
    memory: 'healthy' | 'warning' | 'critical';
    environment: 'healthy' | 'unhealthy';
  };
  metrics?: {
    memoryUsage: number;
    responseTime: number;
  };
}

interface LogEntry {
  id: string;
  level: number;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, any>;
}

export default function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      setError('Failed to fetch health status');
      console.error('Health check error:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchHealthStatus(),
      fetchLogs(),
    ]);
    
    // Get client-side performance metrics
    const perfMetrics = performanceMonitor.getSummary();
    setPerformanceMetrics(perfMetrics);
    
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': case 'critical': return 'text-red-600 bg-red-100';
      case 'not_configured': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLogLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'text-gray-600'; // DEBUG
      case 1: return 'text-blue-600'; // INFO
      case 2: return 'text-yellow-600'; // WARN
      case 3: return 'text-red-600'; // ERROR
      default: return 'text-gray-600';
    }
  };

  const getLogLevelText = (level: number) => {
    switch (level) {
      case 0: return 'DEBUG';
      case 1: return 'INFO';
      case 2: return 'WARN';
      case 3: return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  const exportLogs = () => {
    const clientLogs = logger.getRecentLogs();
    const allLogs = [...logs, ...clientLogs];
    const dataStr = JSON.stringify(allLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">시스템 모니터링</h1>
        <div className="space-x-2">
          <Button onClick={refreshData} variant="outline">
            새로고침
          </Button>
          <Button onClick={exportLogs} variant="outline">
            로그 내보내기
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Health Status */}
      {healthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">전체 상태</h3>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
              {healthStatus.status.toUpperCase()}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              업타임: {Math.floor(healthStatus.uptime / 3600)}시간
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">데이터베이스</h3>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.checks.database)}`}>
              {healthStatus.checks.database.toUpperCase()}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">OpenAI API</h3>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.checks.openai)}`}>
              {healthStatus.checks.openai.replace('_', ' ').toUpperCase()}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">메모리</h3>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.checks.memory)}`}>
              {healthStatus.checks.memory.toUpperCase()}
            </div>
            {healthStatus.metrics && (
              <p className="text-sm text-gray-600 mt-2">
                사용률: {healthStatus.metrics.memoryUsage.toFixed(1)}%
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && Object.keys(performanceMetrics).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">성능 메트릭</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(performanceMetrics).map(([metric, data]: [string, any]) => (
              <div key={metric} className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium text-sm text-gray-700 mb-2">{metric}</h3>
                <div className="space-y-1 text-sm">
                  <div>평균: {data.avg?.toFixed(2)}ms</div>
                  <div>최소: {data.min?.toFixed(2)}ms</div>
                  <div>최대: {data.max?.toFixed(2)}ms</div>
                  <div>P95: {data.p95?.toFixed(2)}ms</div>
                  <div>횟수: {data.count}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Logs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">최근 로그</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">로그가 없습니다.</p>
          ) : (
            logs.slice(0, 50).map((log) => (
              <div key={log.id} className="border-l-4 border-gray-200 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${getLogLevelColor(log.level)}`}>
                      {getLogLevelText(log.level)}
                    </span>
                    {log.context && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.context}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{log.message}</p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      메타데이터 보기
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}