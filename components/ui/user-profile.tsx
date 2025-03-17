'use client';

import { useEffect, useState } from 'react';
import { LoaderSpinner } from './loader-spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { SidebarMenuButton } from './sidebar';
import { ChevronUp, User2 } from 'lucide-react';
import {
  deleteTokenClient,
  getTokenClient,
  setTokenClient,
} from '@/lib/token-client';
import { useRouter } from 'next/navigation';

export default function UserProfile() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const { accessToken, refreshToken } = getTokenClient();

      if (!accessToken && !refreshToken) {
        router.push('/login');
      }

      if (accessToken && refreshToken) {
        const refreshRes = await fetch('/api/auth/token/refresh', {
          method: 'POST',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();

          setTokenClient(refreshData.accessToken, refreshData.refreshToken);
        } else {
          return setUser(null);
        }
      }

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    }

    fetchUser();
  }, []);

  async function handleLogout() {
    const res = await fetch('/api/auth/logout');

    if (res) {
      deleteTokenClient();
    }
    router.push('/login');
  }

  if (!user) {
    return (
      <div>
        <LoaderSpinner className='mx-auto' />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton>
          <User2 /> {user.username}
          <ChevronUp className='ml-auto' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side='top'
        className='w-[--radix-popper-anchor-width]'
      >
        <DropdownMenuItem onClick={handleLogout}>
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
