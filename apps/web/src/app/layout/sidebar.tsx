import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Building2,
  UserCircle,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
  ChevronsUpDown,
  FileText,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/app-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { useCurrentUser } from '@/hooks/use-current-user';
import { authService } from '@/services/auth.service';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed left-3 top-3 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg border-border/60 bg-card/80 backdrop-blur"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'group/sidebar fixed left-0 top-0 z-40 hidden h-screen md:flex transition-[width] duration-200 ease-out',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={onToggle}
          onNavigate={() => {}}
        />

        {/* Edge toggle */}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:scale-110 hover:border-foreground/30 hover:text-foreground group-hover/sidebar:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronsLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SidebarContent
            collapsed={false}
            onToggle={onToggle}
            onNavigate={() => setMobileOpen(false)}
            hideCollapse
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  hideCollapse?: boolean;
}

function SidebarContent({ collapsed, onToggle: _onToggle, onNavigate, hideCollapse: _hideCollapse }: SidebarContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { role } = useCurrentUser();

  const user = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })();
  const initials = user.name ? getInitials(user.name) : '??';

  const allGroups: NavGroup[] = [
    {
      label: t('sidebar.groups.reports'),
      items: [
        { label: t('sidebar.statusReports'), icon: FileText, href: '/status-reports' },
        { label: t('sidebar.goals'), icon: Target, href: '/goals' },
      ],
    },
    {
      label: t('sidebar.groups.administration'),
      items: [
        { label: t('sidebar.companies'), icon: Building2, href: '/companies', roles: ['ADMINISTRATOR'] },
        { label: t('sidebar.users'), icon: Users, href: '/users', roles: ['ADMINISTRATOR'] },
      ],
    },
  ];

  const navGroups = allGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
    }))
    .filter((group) => group.items.length > 0);

  function isActive(href: string) {
    return href === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(href);
  }

  async function handleLogout() {
    await authService.logout();
    navigate('/login', { replace: true });
  }

  function changeLanguage(lng: string) {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  }

  function renderLink(item: NavItem) {
    const active = isActive(item.href);
    return (
      <Link
        to={item.href}
        onClick={onNavigate}
        className={cn(
          'group/link relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
          active
            ? 'bg-foreground/[0.06] text-foreground dark:bg-foreground/[0.08]'
            : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
          collapsed && 'justify-center px-2',
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-foreground/80" />
        )}
        <item.icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors',
            active ? 'text-foreground' : 'text-muted-foreground group-hover/link:text-foreground',
          )}
          strokeWidth={1.7}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  }

  function renderItem(item: NavItem) {
    const linkContent = renderLink(item);

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full flex-col border-r border-border/60 bg-sidebar">
        {/* Brand */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-border/60 px-4',
            collapsed && 'justify-center px-2',
          )}
        >
          <AppLogo className="h-8 w-8" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={cn(groupIndex > 0 && 'mt-6')}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {collapsed && groupIndex > 0 && (
                <div className="mx-auto mb-3 h-px w-6 bg-border/50" />
              )}
              <div className="space-y-0.5">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-border/60 p-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-foreground/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed && 'justify-center',
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/40">
                  <AvatarFallback className="bg-foreground/[0.06] text-[11px] font-semibold text-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-tight text-foreground">
                        {user.name || '—'}
                      </p>
                      <p className="truncate text-[11px] leading-tight text-muted-foreground">
                        {user.email || '—'}
                      </p>
                    </div>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={collapsed ? 'right' : 'top'}
              align={collapsed ? 'end' : 'start'}
              sideOffset={8}
              className="w-[220px]"
            >
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user.name || '—'}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email || '—'}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-sm" onClick={() => navigate('/account')}>
                <UserCircle className="mr-2 h-4 w-4" />
                {t('account.title')}
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm">
                  <Sun className="mr-2 h-4 w-4" />
                  {t('common.theme')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme('light')} className="justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {t('common.light')}
                    </div>
                    {theme === 'light' && <span className="text-xs text-muted-foreground">&#10003;</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      {t('common.dark')}
                    </div>
                    {theme === 'dark' && <span className="text-xs text-muted-foreground">&#10003;</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      {t('common.system')}
                    </div>
                    {theme === 'system' && <span className="text-xs text-muted-foreground">&#10003;</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm">
                  <Languages className="mr-2 h-4 w-4" />
                  {t('common.language')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => changeLanguage('en')} className="justify-between text-sm">
                    English
                    {i18n.language === 'en' && <span className="text-xs text-muted-foreground">&#10003;</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('pt-BR')} className="justify-between text-sm">
                    Português (BR)
                    {i18n.language === 'pt-BR' && <span className="text-xs text-muted-foreground">&#10003;</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('common.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* {!hideCollapse && (
            <button
              onClick={onToggle}
              className={cn(
                'mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground/70 transition-colors hover:bg-foreground/[0.04] hover:text-muted-foreground',
                collapsed && 'justify-center px-2',
              )}
            >
              {collapsed ? (
                <ChevronsRight className="h-3.5 w-3.5" />
              ) : (
                <>
                  <ChevronsLeft className="h-3.5 w-3.5" />
                  <span>{t('sidebar.collapse')}</span>
                </>
              )}
            </button>
          )} */}
        </div>
      </div>
    </TooltipProvider>
  );
}
