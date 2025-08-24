import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: 'degraded',
        service: 'openai',
        timestamp: new Date().toISOString(),
        error: 'OpenAI API key not configured',
      }, { status: 200 }); // Not critical, so return 200
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test OpenAI connection with a simple request
    const models = await openai.models.list();
    
    return NextResponse.json({
      status: 'healthy',
      service: 'openai',
      timestamp: new Date().toISOString(),
      details: {
        modelsAvailable: models.data.length,
        apiKeyConfigured: true,
      }
    });
  } catch (error) {
    console.error('OpenAI health check failed:', error);
    
    return NextResponse.json({
      status: 'degraded', // OpenAI is not critical for core functionality
      service: 'openai',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 200 });
  }
}