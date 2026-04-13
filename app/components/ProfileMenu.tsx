import { Link, Form, useFetcher, href } from 'react-router';
import { motion } from 'motion/react';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';

type ProfileMenuProps = {
  userName: string;
  userEmail: string;
  onClose: () => void;
};

export const ProfileMenu = ({
  userName,
  userEmail,
  onClose,
}: ProfileMenuProps) => {

  const logoutFetcher = useFetcher()

  const handleLogout = () => {
    logoutFetcher.submit(null, {
      action: href("/auth/logout")
    })
  }
  return (
    <>
      {/* Backdrop to close menu */}
      <div className='fixed inset-0 z-40' onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className='absolute right-0 z-50 mt-2 w-56 rounded-xl border border-black/5 bg-white py-2 shadow-lg'
      >
        {/* User Info */}
        <div className='border-b border-black/5 px-4 py-3'>
          <p className='text-sm font-medium text-[#1a1a1a]'>{userName}</p>
          <p className='truncate text-xs text-black/50'>{userEmail}</p>
        </div>

        {/* Menu Items */}
        <div className='py-1'>
          <Link
            to='/profile'
            onClick={onClose}
            className='flex items-center gap-3 px-4 py-2.5 text-sm text-black/70 transition-colors hover:bg-black/5'
          >
            <UserIcon size={16} />
            Profile
          </Link>
          <Link
            to='/settings'
            onClick={onClose}
            className='flex items-center gap-3 px-4 py-2.5 text-sm text-black/70 transition-colors hover:bg-black/5'
          >
            <Settings size={16} />
            Settings
          </Link>
          <div className='my-1 border-t border-black/5' />
          <Form method='post' action='/auth/logout'>
            <button
              type='submit'
              className='flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50'
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </Form>
        </div>
      </motion.div>
    </>
  );
};
