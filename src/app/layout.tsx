import type { Metadata, Viewport } from 'next';
import './globals.css';
import PasswordGate from '@/components/password-gate';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#10B981',
};

export const metadata: Metadata = {
  title: '班级通知时间管理',
  description: '智能识别班级通知，自动生成时间管理表',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '班级通知管理',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <PasswordGate>
          <div className="mx-auto max-w-[480px] min-h-screen relative">
            {children}
          </div>
        </PasswordGate>
      </body>
    </html>
  );
}
