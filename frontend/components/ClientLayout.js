'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  
  // Routes where Navbar should NOT be shown
  const publicRoutes = ['/', '/login', '/register', '/admin/login'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <>
      {!isPublicRoute && <Navbar isAdmin={isAdminRoute} />}
      <main>{children}</main>
    </>
  );
}