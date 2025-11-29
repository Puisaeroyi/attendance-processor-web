import { getUser } from '@/lib/auth/dal';
import { toUserProfile } from '@/lib/auth/types';
import LeaveManagementClient from '@/components/leave/LeaveManagementClient';
import { redirect } from 'next/navigation';

export default async function LeaveManagementPage() {
  const userRaw = await getUser();
  const user = toUserProfile(userRaw);

  // Redirect to login if no user
  if (!user) {
    redirect('/login');
  }

  // Map UserRole to component role type
  const userRole = user.role.toLowerCase() as 'admin' | 'hr' | 'manager' | 'user';

  // Get full name from user profile
  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username;

  return <LeaveManagementClient userRole={userRole} userName={userName} />;
}
