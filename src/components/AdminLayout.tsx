"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Home,
  Menu,
  ClipboardList,
  LogOut
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useIdleTimeout } from '@/lib/useIdleTimeout';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'menu' | 'pre-orders';
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const router = useRouter();

  const performSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error.message);
      toast.error('Error signing out. Please try again.');
      return;
    }

    toast.success('Signed out due to inactivity');
    router.push('/login');
  };

  const handleSignOut = async () => {
    await performSignOut();
  };

  // Idle timeout: 1 minute for testing
  useIdleTimeout(60000, performSignOut);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home, key: 'dashboard' },
    { href: '/menu', label: 'Menu', icon: Menu, key: 'menu' },
    { href: '/pre-orders', label: 'Pre-Orders', icon: ClipboardList, key: 'pre-orders' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b flex justify-center">
          <Image
            src="/images/logo-black.webp"
            alt="La Taberna Logo"
            width={150}
            height={150}
            className="h-22 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentPage === item.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
