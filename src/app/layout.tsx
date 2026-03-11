import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ai数据助手平台',
    template: '%s | Ai数据助手',
  },
  description:
    'Ai数据助手平台，集成项目管理、商品中心、营销中台、企业协同平台等核心模块，助力企业数字化转型升级。',
  keywords: [
    'Ai数据助手',
    'Ai数据助手平台',
    '工作流程管理',
    '项目管理',
    '商品中心',
    '营销中台',
    '企业协同',
    '资源共享',
    '数字化管理',
  ],
  authors: [{ name: 'Ai数据助手' }],
  generator: 'Ai数据助手',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: 'Ai数据助手平台',
    description:
      'Ai数据助手平台，集成项目管理、商品中心、营销中台、企业协同平台等核心模块。',
    siteName: 'Ai数据助手',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
