'use client';

import { FileText, Upload, Zap, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@/components/ui';

export default function Home() {
  const features = [
    {
      icon: FileText,
      title: 'CSV Converter',
      description: 'Convert and transform CSV files with advanced processing capabilities',
      badge: 'Fast',
    },
    {
      icon: Upload,
      title: 'Attendance Processing',
      description: 'Process attendance data with burst detection and shift grouping',
      badge: 'Powerful',
    },
    {
      icon: Zap,
      title: 'Lightning Speed',
      description: 'Handle 10,000+ records in under 10 seconds',
      badge: 'Optimized',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with data validation',
      badge: 'Secure',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-nb-yellow py-nb-16">
        <div className="nb-container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="primary" className="mb-nb-6">
              ✨ Neo Brutalism Design
            </Badge>
            <h1 className="mb-nb-6 font-display text-4xl font-black uppercase leading-tight tracking-tight text-nb-black md:text-6xl">
              Attendance & CSV
              <br />
              Processor Pro
            </h1>
            <p className="mb-nb-8 text-lg text-nb-gray-800 md:text-xl">
              Modern web application for processing attendance data and converting CSV files. Built
              with React, TypeScript, and Tailwind CSS.
            </p>
            <div className="flex flex-col items-center justify-center gap-nb-4 sm:flex-row">
              <Link href="/processor">
                <Button size="lg" variant="primary">
                  Start Processing
                </Button>
              </Link>
              <Link href="/converter">
                <Button size="lg" variant="secondary">
                  Convert CSV
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-nb-white py-nb-16">
        <div className="nb-container">
          <div className="mb-nb-12 text-center">
            <h2 className="mb-nb-4 font-display text-3xl font-black uppercase tracking-tight text-nb-black md:text-4xl">
              Powerful Features
            </h2>
            <p className="text-lg text-nb-gray-600">
              Everything you need to process attendance data efficiently
            </p>
          </div>

          <div className="grid gap-nb-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant={index === 0 ? 'primary' : index === 1 ? 'success' : 'default'}
              >
                <CardHeader>
                  <div className="mb-nb-4 flex items-center justify-between">
                    <div className="rounded-nb bg-nb-gray-100 p-nb-3 border-nb-2 border-nb-black shadow-nb-sm">
                      <feature.icon className="h-6 w-6 text-nb-black" />
                    </div>
                    <Badge variant={index % 2 === 0 ? 'success' : 'primary'}>{feature.badge}</Badge>
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-nb-blue py-nb-16">
        <div className="nb-container">
          <div className="grid gap-nb-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-nb-4 font-display text-5xl font-black text-nb-white">10K+</div>
              <p className="text-lg font-bold uppercase tracking-wide text-nb-white">
                Records/Second
              </p>
            </div>
            <div className="text-center">
              <div className="mb-nb-4 font-display text-5xl font-black text-nb-white">100%</div>
              <p className="text-lg font-bold uppercase tracking-wide text-nb-white">
                Accurate Processing
              </p>
            </div>
            <div className="text-center">
              <div className="mb-nb-4 font-display text-5xl font-black text-nb-white">&lt;10s</div>
              <p className="text-lg font-bold uppercase tracking-wide text-nb-white">
                Processing Time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-nb-white py-nb-16">
        <div className="nb-container">
          <Card variant="primary" className="mx-auto max-w-3xl">
            <CardContent className="p-nb-8 text-center">
              <Clock className="mx-auto mb-nb-6 h-16 w-16 text-nb-blue" />
              <h2 className="mb-nb-4 font-display text-3xl font-black uppercase tracking-tight text-nb-black">
                Ready to Get Started?
              </h2>
              <p className="mb-nb-8 text-lg text-nb-gray-600">
                Process your attendance data with advanced algorithms and get accurate results in
                seconds.
              </p>
              <div className="flex flex-col items-center justify-center gap-nb-4 sm:flex-row">
                <Link href="/processor">
                  <Button size="lg" variant="primary">
                    Try Processor
                  </Button>
                </Link>
                <Link href="/converter">
                  <Button size="lg" variant="success">
                    Try Converter
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
