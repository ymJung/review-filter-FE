import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const healthData = await request.json();
    
    // Log health data for monitoring
    console.log('Health monitoring data received:', {
      overall: healthData.overall,
      score: healthData.score,
      timestamp: healthData.timestamp,
      services: healthData.services.map((s: any) => ({
        service: s.service,
        status: s.status,
        responseTime: s.responseTime,
      })),
    });

    // In production, you might want to:
    // 1. Store health data in a monitoring database
    // 2. Send alerts if health is degraded/unhealthy
    // 3. Update monitoring dashboards
    // 4. Trigger automated recovery procedures

    if (healthData.overall === 'unhealthy') {
      // Log as error for alerting
      logError(
        new Error(`System health is unhealthy: score ${healthData.score}`),
        'health-monitoring',
        { healthData }
      );
    }

    return NextResponse.json({
      status: 'received',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to process health monitoring data:', error);
    
    return NextResponse.json({
      error: 'Failed to process health data',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}