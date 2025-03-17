import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from 'sonner';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/app-sidebar';

export const metadata: Metadata = {
  title: 'Subscriptions Management Dashboard',
  description: 'Subscriptions management dashboard',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger className='m-3' />
        {children}
        <Toaster />
      </main>
    </SidebarProvider>
  );
}
