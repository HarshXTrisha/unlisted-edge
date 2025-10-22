import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple authentication check
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({
        success: false,
        error: { type: 'NO_TOKEN', message: 'Access token required' }
      }, { status: 401 });
    }

    // For now, return a simple response
    return NextResponse.json({
      success: true,
      data: {
        status: 'not_started',
        canTrade: false,
        documents: [],
        message: 'Please upload your KYC documents to start trading'
      }
    });

  } catch (error) {
    console.error('KYC status error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get KYC status'
    }, { status: 500 });
  }
}