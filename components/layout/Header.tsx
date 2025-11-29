'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Upload, CalendarDays, LogOut, User, ChevronDown, Settings, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/auth/types';

interface HeaderProps {
  user: UserProfile | null;
}

export default function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { logout } = await import('@/app/actions/auth')
    await logout()
    window.location.href = '/login'
  }

  // Check if user has manager-level access (ADMIN or MANAGER)
  const hasManagerAccess = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Navigation items with role-based visibility
  const navItems = [
    // Manager/Admin only routes
    ...(hasManagerAccess ? [
      { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
      { name: 'CSV Converter', href: '/converter', icon: FileText },
      { name: 'Processor', href: '/processor', icon: Upload },
    ] : []),
    // All users can access Leave Management
    { name: 'Leave Management', href: '/leave-management', icon: CalendarDays },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="container-glass">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-white transition-colors hover:text-white/80"
          >
            Attendance Pro
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 rounded-xl transition-all duration-200',
                  'hover:text-white hover:bg-white/10'
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.name}
              </Link>
            ))}

            {/* User Dropdown */}
            {user && (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-200',
                    'hover:bg-white/20',
                    isDropdownOpen && 'bg-white/20'
                  )}
                >
                  <User className="h-4 w-4 text-white/80" />
                  <span className="text-sm font-medium text-white">{user.username}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-semibold rounded-full border',
                      user.role === 'ADMIN' && 'bg-red-500/30 text-red-200 border-red-400/40',
                      user.role === 'MANAGER' && 'bg-blue-500/30 text-blue-200 border-blue-400/40',
                      user.role === 'USER' && 'bg-green-500/30 text-green-200 border-green-400/40'
                    )}
                  >
                    {user.role}
                  </span>
                  <ChevronDown className={cn(
                    'h-4 w-4 text-white/60 transition-transform duration-200',
                    isDropdownOpen && 'rotate-180'
                  )} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                    {/* Admin Dashboard - Only show for ADMIN role */}
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin/users"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>User Dashboard</span>
                      </Link>
                    )}

                    {/* Profile Settings (placeholder) */}
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Logout Button - Separate (removed since it's now in dropdown) */}
          </div>
        </nav>
      </div>
    </header>
  );
}
