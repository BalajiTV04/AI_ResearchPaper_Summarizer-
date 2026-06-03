'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar({ isAdmin }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem('adminToken');
      router.push('/admin/login');
    } else {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  if (isAdmin) {
    return (
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Link href="/admin/dashboard">
            <span className={styles.logoIcon}>&#x1F512;</span>
            <span className={styles.logoText}>Admin Panel</span>
          </Link>
        </div>
        <div className={styles.links}>
          <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? styles.active : ''}>Dashboard</Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <Link href="/dashboard">
          <span className={styles.logoIcon}>&#x1F4C4;</span>
          <span className={styles.logoText}>Research AI</span>
        </Link>
      </div>
      <div className={styles.links}>
        <Link href="/dashboard" className={pathname === '/dashboard' ? styles.active : ''}>My Papers</Link>
        <Link href="/upload" className={pathname === '/upload' ? styles.active : ''}>Upload</Link>
        <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}