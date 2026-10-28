import { NextRequest, NextResponse } from 'next/server';

// 密码从环境变量读取，默认密码为 "student2024"
const APP_PASSWORD = process.env.APP_PASSWORD || 'student2024';

// 简单的 token 生成（实际生产中应该用 JWT 或更安全的方案）
function generateToken(): string {
  return Buffer.from(`auth_${Date.now()}_${APP_PASSWORD}`).toString('base64');
}

// 验证 token 是否有效
function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return decoded.includes(APP_PASSWORD);
  } catch {
    return false;
  }
}

// POST /api/auth - 验证密码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, token } = body;

    // 如果是验证 token
    if (token) {
      const isValid = verifyToken(token);
      return NextResponse.json({ valid: isValid });
    }

    // 如果是验证密码
    if (password === APP_PASSWORD) {
      const newToken = generateToken();
      return NextResponse.json({ 
        success: true, 
        token: newToken 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '密码错误' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '验证失败' 
    }, { status: 500 });
  }
}
