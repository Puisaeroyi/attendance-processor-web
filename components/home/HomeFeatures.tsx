'use client';

import { FileText, Upload, Zap, Shield, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { UserProfile } from '@/lib/auth/types';
import { isAdmin } from '@/lib/auth/types';

interface HomeFeaturesProps {
  user: UserProfile | null;
}

export default function HomeFeatures({ user }: HomeFeaturesProps) {
  const features = [
    {
      icon: FileText,
      title: 'CSV Converter',
      description: 'Convert and transform CSV files with advanced processing capabilities',
      badge: 'Fast',
      href: '/converter',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Upload,
      title: 'Attendance Processing',
      description: 'Process attendance data with burst detection and shift grouping',
      badge: 'Powerful',
      href: '/processor',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: CalendarDays,
      title: 'Leave Management',
      description: 'Manage employee leave requests with easy submission flow',
      badge: 'Organized',
      href: '/leave-management',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Zap,
      title: 'Lightning Speed',
      description: 'Handle 10,000+ records in under 10 seconds',
      badge: 'Optimized',
      href: null,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with data validation',
      badge: 'Secure',
      href: isAdmin(user) ? '/admin/users' : null,
      gradient: 'from-red-500 to-rose-500',
    },
  ];

  return (
    <section className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold text-white">
            Powerful Features
          </h2>
          <p className="text-lg text-white/60">
            Everything you need to process attendance data efficiently
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {features.map((feature, index) => {
            const cardContent = (
              <div
                className={`bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 h-full transition-all duration-300 ${
                  feature.href ? 'cursor-pointer hover:bg-white/20 hover:border-white/30 hover:-translate-y-1' : ''
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.gradient}`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/20 text-white/90 border border-white/30">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </div>
            );

            return feature.href ? (
              <Link key={index} href={feature.href}>
                {cardContent}
              </Link>
            ) : (
              <div key={index}>{cardContent}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
