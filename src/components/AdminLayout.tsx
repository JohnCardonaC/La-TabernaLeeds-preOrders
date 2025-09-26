"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Home,
  Utensils,
  LogOut,
  Calendar,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useIdleTimeout } from '@/lib/useIdleTimeout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'menu' | 'bookings';
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const router = useRouter();
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const performSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error.message);
      toast.error('Error signing out. Please try again.');
      return;
    }

    toast.success('Signed out successfully');
    router.push('/login');
  };

  const handleSignOut = async () => {
    await performSignOut();
  };

  const handleIdleTimeout = () => {
    setShowIdleModal(true);
  };

  // Idle timeout: 30 minutes
  useIdleTimeout(1800000, handleIdleTimeout);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home, key: 'dashboard' },
    { href: '/bookings', label: 'Bookings', icon: Calendar, key: 'bookings' },
    { href: '/menu', label: 'Menu', icon: Utensils, key: 'menu' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg flex flex-col relative ${isCollapsed ? 'w-18' : 'w-44'}`}>
        {/* Logo */}
        <div className={`border-b flex justify-center ${isCollapsed ? 'p-2' : 'p-6'}`}>
          <Image
            src="https://res.cloudinary.com/dycdigital/image/upload/v1758807509/logo-black_fgjop4.png"
            alt="La Taberna Logo"
            width={isCollapsed ? 50 : 150}
            height={isCollapsed ? 50 : 150}
            className="h-full w-auto md:h-auto md:w-[80px]"
          />
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className={`${isCollapsed ? 'flex justify-center mb-2' : 'mb-4'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
          </div>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-2 rounded-lg transition-colors ${
                    currentPage === item.key
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign Out */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t`}>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className={`${isCollapsed ? 'w-auto justify-center' : 'w-full justify-start'}`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {!isCollapsed && 'Sign Out'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>

      {/* Idle Timeout Modal */}
      <Dialog open={showIdleModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session Expired</DialogTitle>
            <DialogDescription>
              Your session has expired due to inactivity. Please log in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={performSignOut}>
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
