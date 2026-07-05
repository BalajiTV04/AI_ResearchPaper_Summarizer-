'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './Navbar.module.css';

export default function Navbar({ isAdmin }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem('adminToken');
      router.push('/admin/login');
    } else {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  const closeMenu = () => setMenuOpen(false);

  if (isAdmin) {
    return (
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Link href="/admin/dashboard" onClick={closeMenu}>
            <span className={styles.logoIcon}>&#x1F512;</span>
            <span className={styles.logoText}>Admin Panel</span>
          </Link>
        </div>
        <button 
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          <Link 
            href="/admin/dashboard" 
            className={pathname === '/admin/dashboard' ? styles.active : ''}
            onClick={closeMenu}
          >
            Dashboard
          </Link>
          <button onClick={() => { handleLogout(); closeMenu(); }} className={styles.logoutBtn}>Logout</button>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <Link href="/dashboard" onClick={closeMenu}>
          <span className={styles.logoIcon}>&#x1F4C4;</span>
          <span className={styles.logoText}>Research AI</span>
        </Link>
      </div>
      <button 
        className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
        <Link 
          href="/dashboard" 
          className={pathname === '/dashboard' ? styles.active : ''}
          onClick={closeMenu}
        >
          My Papers
        </Link>
        <Link 
          href="/upload" 
          className={pathname === '/upload' ? styles.active : ''}
          onClick={closeMenu}
        >
          Upload
        </Link>
        <button onClick={() => { handleLogout(); closeMenu(); }} className={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}