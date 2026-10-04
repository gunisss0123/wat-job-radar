'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Nav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '📡 Radar (ทุกงาน)' },
    { href: '/group', label: '👥 3 Friends' },
    { href: '/compare', label: '⚖️ Compare' },
    { href: '/changes', label: '⚡ Live Changes' },
    { href: '/sources', label: '🛡️ Sources & Coverage' },
  ];

  return (
    <header className="nav">
      <Link href="/" className="nav-brand-wrap">
        <div className="nav-logo-icon">⚡</div>
        <div className="brand">
          WAT Job Radar
          <span className="brand-badge">2027 PROMAX</span>
        </div>
      </Link>

      <nav className="nav-links">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
