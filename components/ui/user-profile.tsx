"use client";

import { useEffect, useState } from "react";
import { LoaderSpinner } from "./loader-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { SidebarMenuButton } from "./sidebar";
import { ChevronUp, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { currentUser, logout } from "@/lib/auth";

export default function UserProfile() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await currentUser();

      if (error || !data) {
        router.push("/login");
        return;
      }

      setUser(data);
    };

    fetchUser();
  }, [router]);

  async function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) {
    return (
      <div>
        <LoaderSpinner className="mx-auto" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton>
          <User2 /> {user.username}
          <ChevronUp className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        className="w-[--radix-popper-anchor-width]"
      >
        <DropdownMenuItem onClick={handleLogout}>
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
