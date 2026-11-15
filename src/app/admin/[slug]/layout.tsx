'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { GlobalServiceBellPushNotification } from '@/components/admin/GlobalServiceBellPushNotification';

function BellListenerWrapper() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  if (!slug) return null;
  return <GlobalServiceBellPushNotification slug={slug} />;
}

export default function AdminSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <BellListenerWrapper />
      </Suspense>
      {children}
    </>
  );
}
