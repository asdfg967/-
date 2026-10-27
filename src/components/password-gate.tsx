'use client';

import { useState, useEffect } from 'react';

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 检查是否已认证
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const data = await res.json();
          if (data.valid) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // 提交密码
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
      } else {
        setError(data.error || '密码错误');
      }
    } catch (err) {
      setError('验证失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]">
        <div className="text-[#64748B]">加载中...</div>
      </div>
    );
  }

  // 已认证，显示主内容
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 未认证，显示密码输入界面
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB] px-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm p-8">
        {/* Logo/标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#10B981] rounded-2xl flex items-center justify-center">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-xl font-semibold text-[#1E293B] mb-2">
            学生生活管理台
          </h1>
          <p className="text-sm text-[#64748B]">
            请输入访问密码
          </p>
        </div>

        {/* 密码表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full h-12 px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#10B981] focus:bg-white transition-colors"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="text-sm text-[#EF4444] text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full h-12 rounded-xl bg-[#10B981] text-white font-medium text-base active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '验证中...' : '进入'}
          </button>
        </form>

        {/* 提示 */}
        <div className="mt-6 text-center text-xs text-[#94A3B8]">
          忘记密码请联系管理员
        </div>
      </div>
    </div>
  );
}
