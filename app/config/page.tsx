'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Save, Users, Clock, Settings, ArrowRight } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@/components/ui';
import UserManagementTab from '@/components/config/UserManagementTab';
import ShiftConfigTab from '@/components/config/ShiftConfigTab';

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'shifts'>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="nb-container py-nb-16">
      <div className="mb-nb-12 text-center">
        <div className="mb-nb-6 inline-block rounded-nb bg-nb-purple p-nb-4 border-nb-4 border-nb-black shadow-nb">
          <Settings className="h-12 w-12 text-nb-white" />
        </div>
        <h1 className="mb-nb-4 font-display text-4xl font-black uppercase tracking-tight text-nb-black">
          Configuration Manager
        </h1>
        <p className="text-lg text-nb-gray-600">
          Manage users and shift settings for the attendance processor
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-nb-6 rounded-nb border-nb-4 p-nb-4 ${
          notification.type === 'success'
            ? 'border-nb-green bg-nb-green/10 text-nb-green'
            : 'border-nb-red bg-nb-red/10 text-nb-red'
        }`}>
          <div className="flex items-center gap-nb-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-nb-8">
        <div className="grid grid-cols-2 gap-nb-4 max-w-2xl mx-auto">
          <Button
            variant={activeTab === 'users' ? 'primary' : 'secondary'}
            className={`flex items-center justify-center gap-nb-3 text-base py-nb-6 ${
              activeTab === 'users' ? 'shadow-nb' : ''
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-6 w-6" />
            <span className="font-black uppercase">User Management</span>
            {activeTab === 'users' && <Badge variant="success">Active</Badge>}
          </Button>

          <Button
            variant={activeTab === 'shifts' ? 'primary' : 'secondary'}
            className={`flex items-center justify-center gap-nb-3 text-base py-nb-6 ${
              activeTab === 'shifts' ? 'shadow-nb' : ''
            }`}
            onClick={() => setActiveTab('shifts')}
          >
            <Clock className="h-6 w-6" />
            <span className="font-black uppercase">Shift Settings</span>
            {activeTab === 'shifts' && <Badge variant="success">Active</Badge>}
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto">
        {activeTab === 'users' && (
          <UserManagementTab
            onNotification={showNotification}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {activeTab === 'shifts' && (
          <ShiftConfigTab
            onNotification={showNotification}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>

      {/* Info Section */}
      <div className="mt-nb-16 max-w-2xl mx-auto">
        <Card variant="warning">
          <CardContent className="p-nb-6">
            <div className="flex items-start gap-nb-4">
              <AlertCircle className="h-6 w-6 text-nb-yellow mt-nb-1 flex-shrink-0" />
              <div>
                <h3 className="mb-nb-2 font-bold uppercase tracking-wide text-nb-black">
                  Important Security Notice
                </h3>
                <p className="text-sm text-nb-gray-700 leading-relaxed">
                  Configuration changes are immediately applied to the attendance processor.
                  All changes are validated and backed up automatically. Only authorized personnel
                  should modify these settings. Invalid configurations will be rejected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}