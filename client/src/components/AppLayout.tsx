import { useState, createContext, useContext, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Database,
  Calendar,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  User,
  Zap,
  Sun,
  Battery,
  Wind,
  Building2,
  Activity,
  Search,
  ArrowLeft,
  CheckSquare,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { mockProjects, mockPortfolio, mockAlerts } from "@shared/mockData";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { SkeletonDashboard } from "./Skeleton";
import ThemeToggle from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import { RealtimeNotifications } from "./RealtimeNotifications";
import { toast } from "sonner";
import { useFeatureFlag } from "@/contexts/FeatureFlagContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Project context for filtering
interface ProjectContextType {
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  selectedProjectId: null,
  setSelectedProjectId: () => {},
});

export const useProject = () => useContext(ProjectContext);

// Navigation tabs - text only, no icons
const navTabs = [
  { label: "Summary", path: "/dashboard" },
  { label: "Documents", path: "/documents" },
  { label: "Workspace", path: "/workspace" },
  { label: "Details", path: "/details" },
  { label: "Schedule", path: "/schedule" },
  { label: "Checklist", path: "/checklist" },
  { label: "Operations", path: "/operations" },
];

// Sidebar navigation items
const sidebarNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Workspace", path: "/workspace", icon: ClipboardList },
  { label: "Details", path: "/details", icon: Database },
  { label: "Schedule", path: "/schedule", icon: Calendar },
  { label: "Checklist", path: "/checklist", icon: CheckSquare },
  { label: "Operations", path: "/operations", icon: Activity },
];

// Basic settings navigation items (visible to all users)
const basicSettingsNav = [
  { label: "Settings", path: "/settings", icon: Settings },
  { label: "Profile", path: "/profile", icon: User },
];

// Admin-only settings navigation items
const adminSettingsNav = [
  { label: "Identity Management", path: "/admin/identity", icon: User },
  { label: "Conversations", path: "/admin/conversations", icon: Activity },
  { label: "WhatsApp Templates", path: "/admin/whatsapp-templates", icon: FileText },
  { label: "Integrations", path: "/settings/integrations", icon: Activity },
  { label: "Job Dashboard", path: "/admin/jobs", icon: Activity },
];

// Technology icons
const techIcons: Record<string, typeof Sun> = {
  PV: Sun,
  BESS: Battery,
  "PV+BESS": Zap,
  Wind: Wind,
  Minigrid: Building2,
  "C&I": Building2,
};

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const commandPalette = useCommandPalette();

  const unreadAlerts = mockAlerts.filter((a) => !a.isRead).length;

  // Get current page title
  const currentTab = navTabs.find((t) => t.path === location);
  const selectedProject = selectedProjectId
    ? mockProjects.find((p) => p.id === selectedProjectId)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SkeletonDashboard />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <ProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId }}>
      <div className="min-h-screen bg-[var(--color-bg-base)] flex">
        {/* Left Sidebar - Fixed 240px */}
        <aside
          className={cn(
            "h-screen sticky top-0 flex flex-col transition-all duration-200",
            "bg-[var(--color-bg-surface)] border-r border-[var(--color-border-subtle)]",
            sidebarCollapsed ? "w-16" : "w-60"
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border-subtle)]">
            {!sidebarCollapsed && (
              <Link href="/dashboard">
                <div className="flex items-center gap-2.5 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center">
                    <Zap className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)]">KIISHA</span>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link href="/dashboard">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center cursor-pointer mx-auto">
                  <Zap className="w-4.5 h-4.5 text-white" />
                </div>
              </Link>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Search trigger */}
          {!sidebarCollapsed && (
            <div className="px-3 py-3">
              <button
                onClick={commandPalette.open}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--color-text-tertiary)] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-surface-hover)]">⌘K</kbd>
              </button>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-3">
              <button
                onClick={commandPalette.open}
                className="w-full flex items-center justify-center p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            <div className="space-y-1">
              {sidebarNav.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] border-l-3 border-[var(--color-brand-primary)] -ml-[3px] pl-[calc(0.75rem+3px)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-[var(--color-border-subtle)]" />

            {/* Projects section */}
            {!sidebarCollapsed && (
              <div className="mb-2 px-3">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Projects
                </span>
              </div>
            )}

            <div className="space-y-0.5">
              {/* All Projects */}
              <button
                onClick={() => setSelectedProjectId(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  selectedProjectId === null
                    ? "bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">All Projects</span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {mockProjects.length}
                    </span>
                  </>
                )}
              </button>

              {/* Individual Projects */}
              {mockProjects.slice(0, sidebarCollapsed ? 5 : 10).map((project) => {
                const TechIcon = techIcons[project.technology] || Sun;
                const isSelected = selectedProjectId === project.id;

                return (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                  >
                    <TechIcon className="w-4 h-4 flex-shrink-0 text-[var(--color-text-tertiary)]" />
                    {!sidebarCollapsed && (
                      <span className="flex-1 text-left truncate">{project.name}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Settings section - visible to all users */}
            <>
              {/* Divider */}
              <div className="my-4 border-t border-[var(--color-border-subtle)]" />

              {/* Settings label */}
              {!sidebarCollapsed && (
                <div className="mb-2 px-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Settings
                  </span>
                </div>
              )}

              {/* Basic settings - visible to all users */}
              <div className="space-y-0.5">
                {basicSettingsNav.map((item) => {
                  const isActive = location === item.path;
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] border-l-3 border-[var(--color-brand-primary)] -ml-[3px] pl-[calc(0.75rem+3px)]"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]",
                          sidebarCollapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </button>
                    </Link>
                  );
                })}
              </div>

              {/* Admin-only settings */}
              {user?.role === 'admin' && (
                <div className="space-y-0.5 mt-1">
                  {adminSettingsNav.map((item) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path}>
                        <button
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                              ? "bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] border-l-3 border-[var(--color-brand-primary)] -ml-[3px] pl-[calc(0.75rem+3px)]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]",
                            sidebarCollapsed && "justify-center px-2"
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          </nav>

          {/* Theme toggle */}
          <div className="px-3 pb-2">
            <ThemeToggle collapsed={sidebarCollapsed} />
          </div>

          {/* User section at bottom */}
          <div className="border-t border-[var(--color-border-subtle)] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[var(--color-bg-surface-hover)] transition-colors",
                    sidebarCollapsed && "justify-center"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary-muted)] flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[var(--color-brand-primary)]" />
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {user.name || "User"}
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">Cloudbreak</div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center px-6 shrink-0">
            {/* Back navigation + Page title */}
            <div className="flex items-center gap-4">
              {selectedProject ? (
                <>
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Projects
                  </button>
                  <span className="text-[var(--color-text-tertiary)]">/</span>
                  <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {selectedProject.name}
                  </h1>
                </>
              ) : (
                <>
                  <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {mockPortfolio.name}
                  </h1>
                  {currentTab && (
                    <>
                      <span className="text-[var(--color-text-tertiary)]">/</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {currentTab.label}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Tab navigation - only show when project selected */}
            {selectedProject && (
              <nav className="tab-nav ml-8 h-full flex items-end">
                {navTabs.map((tab) => {
                  const isActive = location === tab.path;
                  return (
                    <Link key={tab.path} href={tab.path}>
                      <button
                        className={cn(
                          "tab-item px-4 pb-4",
                          isActive && "tab-item-active"
                        )}
                      >
                        {tab.label}
                      </button>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-3">
              {/* Global Search */}
              <GlobalSearch />

              {/* Real-time Notifications */}
              <RealtimeNotifications />

              {/* Project Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="btn-secondary h-9">
                    Actions
                    <ChevronDown className="w-4 h-4 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => toast.info("Portfolio export is being configured for your organization")}
                    className="cursor-pointer"
                  >
                    Export Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => toast.info("Report generation is being configured for your organization")}
                    className="cursor-pointer"
                  >
                    Generate Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    disabled 
                    className="opacity-50 cursor-not-allowed"
                    title="Contact your administrator to add new projects"
                  >
                    Add New Project
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    disabled 
                    className="opacity-50 cursor-not-allowed"
                    title="Portfolio settings are managed by administrators"
                  >
                    Portfolio Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>

        {/* Command Palette */}
        <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
      </div>
    </ProjectContext.Provider>
  );
}
