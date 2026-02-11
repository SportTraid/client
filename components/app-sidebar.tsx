"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, BookOpen, Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ChatHistory } from "@/components/chat-history";

const menuItems = [
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Journal", url: "/journal", icon: BookOpen },
  { title: "Nudges", url: "/nudges", icon: Bell },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : "User";
  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.username?.slice(0, 2)?.toUpperCase() || "U"
    : "U";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-start p-4">
        <Link href="/chat" className="flex items-center">
          <Image
            src={isDark ? "/white T.png" : "/black T.png"}
            alt="Triad Logomark"
            width={32}
            height={32}
            className="object-contain"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <ChatHistory />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip={displayName}
                  size="lg"
                  className="w-full justify-start"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start gap-0.5 group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium">{displayName}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

