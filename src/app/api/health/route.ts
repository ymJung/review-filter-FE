import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

interface HealthCheck {
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

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: 'healthy',
      openai: 'not_configured',
      memory: 'healthy',
      environment: 'healthy',
    },
  };

  // Check database connection
  try {
    await db.collection('health').doc('check').set({
      timestamp: new Date(),
      status: 'healthy',
    });
    healthCheck.checks.database = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    healthCheck.checks.database = 'unhealthy';
    healthCheck.status = 'unhealthy';
  }

  // Check OpenAI API configuration
  if (process.env.OPENAI_API_KEY) {
    try {
      // Simple configuration check - don't make actual API call for health check
      healthCheck.checks.openai = 'healthy';
    } catch (error) {
      healthCheck.checks.openai = 'unhealthy';
      healthCheck.status = 'degraded';
    }
  }

  // Check memory usage
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (memoryUsagePercent > 90) {
      healthCheck.checks.memory = 'critical';
      healthCheck.status = 'unhealthy';
    } else if (memoryUsagePercent > 75) {
      healthCheck.checks.memory = 'warning';
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    healthCheck.metrics = {
      memoryUsage: memoryUsagePercent,
      responseTime: Date.now() - startTime,
    };
  }

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    healthCheck.checks.environment = 'unhealthy';
    healthCheck.status = 'unhealthy';
    console.error('Missing environment variables:', missingEnvVars);
  }

  // Set response status based on health
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}

// Simple ping endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}