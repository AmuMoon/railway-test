import { NextResponse } from "next/server";
import { execSync } from "child_process";

/**
 * POST /api/setup
 * 运行数据库迁移（仅用于初始化）
 */
export async function POST() {
  try {
    // 运行 Prisma 迁移
    const result = execSync("npx prisma migrate deploy", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      message: "Database migration completed",
      output: result,
    });
  } catch (error: any) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error.message,
        stderr: error.stderr?.toString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup
 * 检查设置状态
 */
export async function GET() {
  return NextResponse.json({
    message: "Use POST to run database migration",
    endpoint: "/api/setup",
    method: "POST",
  });
}
