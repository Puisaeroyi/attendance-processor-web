'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Upload, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const navItems = [
    { name: 'Home', href: '/', icon: null },
    { name: 'CSV Converter', href: '/converter', icon: FileText },
    { name: 'Attendance Processor', href: '/processor', icon: Upload },
    { name: 'Leave Management', href: '/leave-management', icon: CalendarDays },
  ];

  return (
    <header className="border-b-nb-4 border-nb-black bg-nb-white shadow-nb">
      <div className="nb-container">
        <nav className="flex items-center justify-between py-nb-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-black uppercase tracking-tight text-nb-black transition-colors hover:text-nb-blue"
          >
            Attendance Pro
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-nb-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-nb-2 px-nb-4 py-nb-2 text-sm font-bold uppercase tracking-wide transition-all duration-150',
                  'border-nb-2 border-transparent hover:border-nb-black hover:shadow-nb-sm'
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
