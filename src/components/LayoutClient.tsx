"use client";

import AppShell from '@/components/AppShell';
import ErrorBoundary from '@/components/ErrorBoundary';
import InstallPrompt from '@/components/InstallPrompt';

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ErrorBoundary>
        <AppShell>{children}</AppShell>
      </ErrorBoundary>
      <InstallPrompt />
    </>
  );
}