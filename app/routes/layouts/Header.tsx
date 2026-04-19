import { Link, useLocation } from 'react-router';
import { useUser } from '~/utils/useUser';
import { ProfileMenu } from '~/components/ProfileMenu';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Bell,
} from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/create', label: 'Create', icon: PlusCircle },
];

export const Header = () => {
  const { user } = useUser();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className='sticky top-0 z-50 border-b border-black/5 bg-white shadow-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link to='/' className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#5A5A40]'>
              <GraduationCap className='h-6 w-6 text-white' />
            </div>
            <span className='font-serif text-xl text-[#1a1a1a]'>CourseX</span>
          </Link>

          {/* Main Navigation */}
          <nav className='hidden items-center gap-1 md:flex'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#5A5A40]/10 text-[#5A5A40]'
                      : 'text-black/60 hover:bg-black/5 hover:text-black/80'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className='flex items-center gap-2'>
            {/* Notifications */}
            <button className='relative rounded-lg p-2 text-black/60 transition-colors hover:bg-black/5 hover:text-black/80'>
              <Bell size={20} />
              <span className='absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500'></span>
            </button>

            {/* Profile Menu */}
            <div className='relative'>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className='flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-black/5'
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className='h-8 w-8 rounded-full object-cover ring-2 ring-[#5A5A40]/20'
                  />
                ) : (
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[#5A5A40] text-sm font-medium text-white'>
                    {user?.name ? getInitials(user.name) : 'U'}
                  </div>
                )}
              </button>

              {showProfileMenu && user && (
                <ProfileMenu
                  userName={user.name}
                  userEmail={user.email}
                  userId={user.id}
                  avatarUrl={user.avatarUrl}
                  onClose={() => setShowProfileMenu(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
