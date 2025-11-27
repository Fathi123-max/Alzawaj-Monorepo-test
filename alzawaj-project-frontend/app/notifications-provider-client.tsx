// app/notifications-provider-client.tsx
'use client';

import { useEffect } from 'react';
import { useNotificationSetup } from '@/lib/services/notification-service';

// Client-side component to initialize notification system
export default function NotificationsProviderClient({
  children
}: {
  children: React.ReactNode;
}) {
  useNotificationSetup();

  return <>{children}</>;
}