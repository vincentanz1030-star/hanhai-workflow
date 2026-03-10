import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '瀚海集团工作流程管理系统',
    template: '%s | 瀚海集团',
  },
  description:
    '瀚海集团工作流程管理系统，集成项目管理、商品中心、营销中台、企业协同平台等核心模块，助力企业数字化转型升级。',
  keywords: [
    '瀚海集团',
    '工作流程管理',
    '项目管理',
    '商品中心',
    '营销中台',
    '企业协同',
    '资源共享',
    '数字化管理',
  ],
  authors: [{ name: '瀚海集团' }],
  generator: '瀚海集团',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '瀚海集团工作流程管理系统',
    description:
      '瀚海集团工作流程管理系统，集成项目管理、商品中心、营销中台、企业协同平台等核心模块。',
    siteName: '瀚海集团',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
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
