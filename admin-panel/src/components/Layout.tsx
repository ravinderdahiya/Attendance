import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Radar, CalendarClock, ClipboardList, LogOut,
  Wallet, DoorOpen, ShieldCheck, HardHat, Route,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/outlets', label: 'Outlets', icon: MapPin },
  { to: '/roster', label: 'Roster', icon: CalendarClock },
  { to: '/timesheets', label: 'Timesheets', icon: ClipboardList },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
  { to: '/live-monitor', label: 'Live monitor', icon: Radar },
];

const MODULE_NAV_ITEMS = [
  { to: '/visitors', label: 'Visitor Log', icon: DoorOpen },
  { to: '/patrols', label: 'Security Patrols', icon: ShieldCheck },
  { to: '/labour', label: 'Labour Attendance', icon: HardHat },
  { to: '/field-visits', label: 'Field Visits', icon: Route },
];

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[11.5px] font-bold relative ${
          isActive ? 'bg-white/[0.13] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'text-white/60'
        }`
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </NavLink>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-56 shrink-0 bg-gradient-to-b from-[#0A0912] to-terra-deep text-white p-5 flex flex-col overflow-y-auto">
        <div>
          <img src="/brand/logo.png" alt="म्हारी ढाणी" className="h-10 w-auto max-w-full object-contain" />
          <div className="text-[10px] font-bold text-white/55 tracking-wide mt-1.5">Manager panel</div>
        </div>
        <nav className="mt-7 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} />)}
          <div className="font-mono text-[9px] font-bold tracking-wide uppercase text-white/35 px-2.5 pt-4 pb-1.5">Attendance modules</div>
          {MODULE_NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>
        <button
          onClick={logout}
          className="mt-auto flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[11.5px] font-bold text-white/60 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      <main className="flex-1 min-w-0 p-7 bg-paper">
        {user && <div className="text-[11px] font-semibold text-text-mute mb-3">Signed in as {user.name}</div>}
        {children}
      </main>
    </div>
  );
}
