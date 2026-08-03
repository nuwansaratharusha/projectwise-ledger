import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  CaretUpDown,
  SquaresFour,
  FolderSimple,
  CreditCard,
  TrendUp,
  Users,
  ChartBar,
  GearSix,
  SignOut,
  Moon,
  Sun,
  Plus,
} from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useProfile } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { GlobalSearch } from "./global-search";
import { QuickActions } from "./quick-actions";

/* ─── Navigation grouped like Jira ─── */
const NAV_GROUPS = [
  {
    label: "Navigation",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: SquaresFour },
      { to: "/projects", label: "Projects", icon: FolderSimple },
      { to: "/clients", label: "Clients", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/payments", label: "Payments", icon: CreditCard },
      { to: "/investments", label: "Investments", icon: TrendUp },
      { to: "/reports", label: "Reports", icon: ChartBar },
    ],
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { theme, toggle } = useTheme();

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayName = profile?.full_name || user?.email || "User";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        {/* ── Logo ── */}
        <SidebarHeader className="px-3 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <span className="text-[15px] font-semibold tracking-tight">
                    Project Ledger
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ── Grouped Navigation ── */}
        <SidebarContent>
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 px-3">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.to}
                        tooltip={item.label}
                      >
                        <Link to={item.to}>
                          <item.icon className="h-[18px] w-[18px]" />
                          <span className="text-[13px]">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {/* Settings as standalone item */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/settings"}
                    tooltip="Settings"
                  >
                    <Link to="/settings">
                      <GearSix className="h-[18px] w-[18px]" />
                      <span className="text-[13px]">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── User footer ── */}
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none text-left">
                      <span className="truncate text-[13px] font-medium">
                        {displayName}
                      </span>
                      {profile?.business_name ? (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {profile.business_name}
                        </span>
                      ) : null}
                    </div>
                    <CaretUpDown className="ml-auto h-3.5 w-3.5 shrink-0 opacity-40" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className="w-56"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <GearSix className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggle}>
                    {theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => supabase.auth.signOut()}
                    className="text-destructive focus:text-destructive"
                  >
                    <SignOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* ── Top bar — Jira-inspired clean header ── */}
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1 h-7 w-7" />

          {/* Center: Search */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-md">
              <GlobalSearch />
            </div>
          </div>

          {/* Right: Create + theme toggle */}
          <div className="flex items-center gap-1.5">
            <QuickActions />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-7 w-7"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
