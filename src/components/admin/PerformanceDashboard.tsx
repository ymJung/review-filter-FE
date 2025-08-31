'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Alert
} from '@/components/ui';
import { 
  usePerformance, 
  usePerformanceBudget,
  usePerformanceDebug 
} from '@/hooks/usePerformance';
import { ServiceFactory } from '@/lib/services/optimizedService';
import { queryAnalyzer } from '@/lib/utils/queryOptimization';

export const PerformanceDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { 
    webVitals, 
    memoryUsage, 
    connectionInfo, 
    cacheStats, 
    recommendations,
    isSlowConnection,
    isLowMemory,
    refreshData 
  } = usePerformance();

  // Memoize the budgets object to prevent it from changing on every render
  const performanceBudgets = useMemo(() => ({
    maxRenderTime: 2500, // 2.5 seconds for FCP
    maxMemoryUsage: 50, // 50MB
  }), []);

  const { violations, isWithinBudget } = usePerformanceBudget(performanceBudgets);

  const { collectDebugInfo, exportDebugInfo } = usePerformanceDebug();

  const [queryReport, setQueryReport] = useState<any>(null);

  useEffect(() => {
    // Get query performance report
    const report = queryAnalyzer.generateReport();
    setQueryReport(report);
  }, [refreshKey]);

  const handleRefresh = () => {
    refreshData();
    setRefreshKey(prev => prev + 1);
  };

  const handleClearCaches = () => {
    ServiceFactory.clearAllCaches();
    setRefreshKey(prev => prev + 1);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const getPerformanceScore = (): { score: number; grade: string; color: string } => {
    let score = 100;
    
    // Deduct points for poor Web Vitals
    if (webVitals.FCP && webVitals.FCP > 2500) score -= 20;
    if (webVitals.LCP && webVitals.LCP > 4000) score -= 25;
    if (webVitals.FID && webVitals.FID > 300) score -= 20;
    if (webVitals.CLS && webVitals.CLS > 0.25) score -= 15;
    if (webVitals.TTFB && webVitals.TTFB > 800) score -= 10;

    // Deduct points for slow queries
    if (queryReport?.averageExecutionTime > 1000) score -= 10;

    let grade = 'A';
    let color = 'text-green-600';
    
    if (score < 90) { grade = 'B'; color = 'text-yellow-600'; }
    if (score < 80) { grade = 'C'; color = 'text-orange-600'; }
    if (score < 70) { grade = 'D'; color = 'text-red-600'; }
    if (score < 60) { grade = 'F'; color = 'text-red-800'; }

    return { score: Math.max(0, score), grade, color };
  };

  const performanceScore = getPerformanceScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">성능 대시보드</h1>
          <p className="text-gray-600">애플리케이션 성능 메트릭 및 최적화 현황</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            새로고침
          </Button>
          <Button onClick={handleClearCaches} variant="outline" size="sm">
            캐시 초기화
          </Button>
          <Button onClick={exportDebugInfo} variant="ghost" size="sm">
            디버그 정보 내보내기
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle>전체 성능 점수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`text-4xl font-bold ${performanceScore.color}`}>
              {performanceScore.score}
            </div>
            <div>
              <div className={`text-2xl font-semibold ${performanceScore.color}`}>
                {performanceScore.grade}
              </div>
              <div className="text-sm text-gray-600">
                {isWithinBudget ? '예산 내' : '예산 초과'}
              </div>
            </div>
            <div className="flex space-x-2">
              {isSlowConnection && (
                <Badge variant="warning">느린 연결</Badge>
              )}
              {isLowMemory && (
                <Badge variant="danger">메모리 부족</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Violations */}
      {violations.length > 0 && (
        <Alert variant="warning" title="성능 예산 위반">
          <ul className="list-disc list-inside space-y-1">
            {violations.map((violation, index) => (
              <li key={index} className="text-sm">{violation}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FCP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.FCP ? formatTime(webVitals.FCP) : 'N/A'}
            </div>
            <p className="text-xs text-gray-600">First Contentful Paint</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">LCP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.LCP ? formatTime(webVitals.LCP) : 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Largest Contentful Paint</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.FID ? formatTime(webVitals.FID) : 'N/A'}
            </div>
            <p className="text-xs text-gray-600">First Input Delay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CLS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.CLS ? webVitals.CLS.toFixed(3) : 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Cumulative Layout Shift</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">TTFB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.TTFB ? formatTime(webVitals.TTFB) : 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Time to First Byte</p>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle>메모리 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            {memoryUsage ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>사용 중:</span>
                  <span className="font-mono">
                    {formatBytes(memoryUsage.usedJSHeapSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>총 할당:</span>
                  <span className="font-mono">
                    {formatBytes(memoryUsage.totalJSHeapSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>한계:</span>
                  <span className="font-mono">
                    {formatBytes(memoryUsage.jsHeapSizeLimit)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100}%`
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500">메모리 정보를 사용할 수 없습니다</p>
            )}
          </CardContent>
        </Card>

        {/* Connection Information */}
        <Card>
          <CardHeader>
            <CardTitle>연결 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {connectionInfo ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>연결 타입:</span>
                  <Badge variant={isSlowConnection ? 'danger' : 'success'}>
                    {connectionInfo.effectiveType}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>다운링크:</span>
                  <span className="font-mono">{connectionInfo.downlink} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span>RTT:</span>
                  <span className="font-mono">{connectionInfo.rtt}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>데이터 절약:</span>
                  <Badge variant={connectionInfo.saveData ? 'warning' : 'secondary'}>
                    {connectionInfo.saveData ? '활성화' : '비활성화'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">연결 정보를 사용할 수 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>캐시 통계</CardTitle>
        </CardHeader>
        <CardContent>
          {cacheStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {cacheStats.memory?.size || 0}
                </div>
                <p className="text-sm text-gray-600">메모리 캐시 항목</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(cacheStats.memory?.hitRate * 100 || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">캐시 적중률</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {cacheStats.storage?.size || 0}
                </div>
                <p className="text-sm text-gray-600">스토리지 캐시 항목</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">캐시 통계를 사용할 수 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* Query Performance */}
      <Card>
        <CardHeader>
          <CardTitle>쿼리 성능</CardTitle>
        </CardHeader>
        <CardContent>
          {queryReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {queryReport.totalQueries}
                  </div>
                  <p className="text-sm text-gray-600">총 쿼리 수</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatTime(queryReport.averageExecutionTime)}
                  </div>
                  <p className="text-sm text-gray-600">평균 실행 시간</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {queryReport.cacheHitRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">캐시 적중률</p>
                </div>
              </div>

              {queryReport.slowQueries.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">느린 쿼리 (1초 이상)</h4>
                  <div className="space-y-2">
                    {queryReport.slowQueries.slice(0, 5).map((query: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm font-mono truncate">{query.query}</span>
                        <span className="text-sm text-red-600">
                          {formatTime(query.metrics.executionTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">쿼리 성능 데이터를 사용할 수 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>성능 개선 권장사항</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">⚠️</span>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};