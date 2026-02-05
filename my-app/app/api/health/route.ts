import { NextResponse } from "next/server";

/**
 * GET /api/health
 * 健康检查端点 - 简化版，不依赖数据库
 */
export async function GET() {
  return NextResponse.json({
    healthy: true,
    timestamp: new Date().toISOString(),
    message: "Service is running"
  }, { status: 200 });
}
