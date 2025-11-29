import type { Metadata } from 'next';
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import { getUser } from '@/lib/auth/dal';
import { toUserProfile } from '@/lib/auth/types';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Attendance Processor Pro - CSV Converter & Attendance Management',
  description:
    'Modern web application for processing attendance data and converting CSV files with Neo Brutalism design.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userRaw = await getUser();
  const user = toUserProfile(userRaw);

  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} min-h-screen`}>
        <div className="flex min-h-screen flex-col">
          <Header user={user} />
          <main className="flex-1 pt-20">{children}</main>
        </div>
      </body>
    </html>
  );
}
