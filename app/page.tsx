import { FileText, Upload, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { getUser } from '@/lib/auth/dal';
import { toUserProfile } from '@/lib/auth/types';

export default async function Home() {
  const userRaw = await getUser();
  const user = toUserProfile(userRaw);

  // Check if user has manager-level access
  const hasManagerAccess = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const features = [
    {
      icon: Upload,
      title: 'Attendance Processor',
      description: 'Process attendance data with advanced algorithms for accurate shift detection.',
      href: '/processor',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      title: 'CSV Converter',
      description: 'Convert and transform CSV files with ease. Support for multiple formats.',
      href: '/converter',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: CalendarDays,
      title: 'Leave Management',
      description: 'Manage leave requests, approvals, and track team availability.',
      href: '/leave-management',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  // Simple homepage for USER role
  if (user && !hasManagerAccess) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center pb-12">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Attendance & CSV
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Processor Pro
            </span>
          </h1>
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <p className="text-2xl text-white/90">
              Welcome back, <span className="font-bold text-white">{user.username}</span>!
            </p>
            <p className="mt-4 text-white/60">
              Navigate to Leave Management to submit and track your leave requests.
            </p>
            <Link
              href="/leave-management"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl border border-white/20 hover:shadow-[0_0_20px_rgba(52,199,89,0.5)] transition-all"
            >
              <CalendarDays className="w-5 h-5" />
              Go to Leave Management
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Full homepage for ADMIN and MANAGER roles
  return (
    <div className="min-h-[calc(100vh-5rem)] pb-12">
      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Attendance & CSV
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Processor Pro
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/processor"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl border border-white/20 hover:shadow-[0_0_30px_rgba(102,126,234,0.5)] transition-all duration-300 active:scale-95"
            >
              Start Processing
            </Link>
            <Link
              href="/converter"
              className="px-8 py-3 bg-white/15 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 active:scale-95"
            >
              Convert CSV
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Everything you need to manage attendance and process data efficiently.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 h-full hover:bg-white/20 hover:border-white/30 hover:shadow-[0_8px_32px_rgba(31,38,135,0.25)] transition-all duration-300 group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* User greeting if logged in */}
      {user && (
        <section className="py-6 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
              <p className="text-white/80">
                Welcome back, <span className="font-semibold text-white">{user.username}</span>!
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-white/20 text-white/90">
                  {user.role}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
