import type { Metadata } from 'next';
import './course.css';
import './faithful-design.css';
export const metadata: Metadata = { title: '食物中的養分與能量｜養分研究所', description: '從餐桌出發，用證據認識養分。', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
