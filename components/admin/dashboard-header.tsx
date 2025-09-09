'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { useAdminSidebar } from '@/components/layout/AdminLayout';

interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

const getInitials = (name?: string | null): string => {
  if (!name) return 'A';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .join('')
    .toUpperCase();
};

export function DashboardHeader({ userName = 'Admin', userEmail = '', userImage }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { sidebarOpen, setSidebarOpen } = useAdminSidebar();
  const userInitials = getInitials(userName);

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any local storage items
      localStorage.removeItem("user");
      
      toast.success("You have been signed out successfully");
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out. Please try again.");
      
      // If there's an error, still try to redirect to home
      router.push('/');
    }
  };

  return (
    <>
      {/* Ensure header sits above the sidebar (z-50) and is offset on desktop */}
      <header className="sticky top-0 z-50 md:ml-64 border-b border-gray-200 bg-gray-50">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="mr-2 block md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="w-64 rounded-md border bg-gray-50 pl-9 focus:border-zervia-500 focus:ring-zervia-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-zervia-500"></span>
              <span className="sr-only">Notifications</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center rounded-full p-0.5">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={userImage || ''} alt={userName || 'Admin'} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10 rounded-full">
                    <AvatarImage src={userImage || ''} alt={userName || 'Admin'} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{userName || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{userEmail || ''}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
} 