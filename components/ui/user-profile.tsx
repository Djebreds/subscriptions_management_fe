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
import { currentUser, logout } from '@/lib/auth';

export default function UserProfile() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const router = useRouter();

  // useEffect(() => {
  //   async function fetchUser() {
  //     const { accessToken, refreshToken } = getTokenClient();

  //     if (!accessToken && !refreshToken) {
  //       router.push('/login');
  //       return;
  //     }

  //     let res = await fetch('/api/auth/me', {
  //       method: 'GET',
  //       headers: { Authorization: `Bearer ${accessToken}` },
  //     });

  //     if (res.status === 401 && refreshToken) {
  //       const refreshResponse = await fetch('/api/auth/refresh', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ refreshToken }),
  //       });

  //       if (refreshResponse.ok) {
  //         const { accessToken: newAccessToken } = await refreshResponse.json();

  //         setTokenClient(accessToken as string, refreshToken);

  //         res = await fetch('/api/auth/me', {
  //           method: 'GET',
  //           headers: { Authorization: `Bearer ${newAccessToken}` },
  //         });

  //         if (!res.ok) {
  //           router.push('/login');
  //           return;
  //         }
  //       } else {
  //         router.push('/login');
  //         return;
  //       }
  //     }

  //     const userData = await res.json();
  //     setUser(userData.user);
  //   }

  //   fetchUser();
  // }, [router]);

  // async function handleLogout() {
  //   const res = await fetch('/api/auth/logout');

  //   if (res) {
  //     deleteTokenClient();
  //   }
  //   router.push('/login');
  // }

  // if (!user) {
  //   return (
  //     <div>
  //       <LoaderSpinner className='mx-auto' />
  //     </div>
  //   );
  // }

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await currentUser();

      if (error || !data) {
        router.push('/login');
        return;
      }

      setUser(data);
    };

    fetchUser();
  }, [router]);

  async function handleLogout() {
    logout();
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
