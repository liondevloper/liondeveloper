import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { adminApi, AuthError } from './api';
import Content from './Content';
import Dashboard from './Dashboard';
import Enquiries from './Enquiries';
import Login from './Login';
import Settings from './Settings';
import './admin.css';

export default function AdminApp() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    adminApi
      .me()
      .then((admin) => setEmail(admin.email))
      .catch((error) => {
        if (!(error instanceof AuthError)) console.error(error);
        setEmail(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const signOut = async () => {
    await adminApi.logout();
    setEmail(null);
  };

  if (checking) {
    return <div className="admin-shell"><p className="admin-muted admin-page">Loading...</p></div>;
  }

  if (!email) {
    return <div className="admin-shell"><Login onSignedIn={setEmail} /></div>;
  }

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <Link className="admin-brand" to="/admin">
          <strong>LION</strong><small>ADMIN</small>
        </Link>
        <nav>
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/enquiries">Enquiries</NavLink>
          <NavLink to="/admin/content">Content</NavLink>
          <NavLink to="/admin/settings">Settings</NavLink>
        </nav>
        <div className="admin-bar-right">
          <a href="/" target="_blank" rel="noreferrer">View site <ArrowUpRight size={13} /></a>
          <button type="button" onClick={signOut}><LogOut size={14} /> Sign out</button>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="content" element={<Content />} />
          <Route path="settings" element={<Settings email={email} />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
