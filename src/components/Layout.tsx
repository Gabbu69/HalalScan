import { Link, NavLink, Outlet } from 'react-router-dom';
import { Home, ScanLine, Bookmark, BookOpen, Settings, WifiOff, AlertCircle } from 'lucide-react';
import { useCopy } from '../utils/copy';
import { useAppStore } from '../store/useAppStore';
import { useOnline } from '../hooks/useOnline';
import { PwaNotice } from './PwaNotice';
export function Layout() {
 const c = useCopy(); const online = useOnline();
 const error = useAppStore(s => s.storageError); const initialize = useAppStore(s => s.initialize);
 return <div className="app-shell">
  <a className="skip-link" href="#main">Skip to content</a>
  <header className="app-header"><div className="header-inner">
   <Link to="/" className="brand"><img src="/logo.png" alt="" /><span>HalalScan</span></Link>
   <nav className="main-nav" aria-label="Main navigation">
    {[['/', 'home', Home], ['/scanner', 'scan', ScanLine], ['/history', 'saved', Bookmark], ['/knowledge', 'guide', BookOpen]].map(([to,key,Icon]: any) => <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}><Icon size={20} aria-hidden="true" />{c(key)}</NavLink>)}
   </nav>
   <Link className="icon-button" to="/profile" aria-label={c('settings')}><Settings size={21} /></Link>
  </div></header>
  {!online && <div className="notice global-notice" role="status"><WifiOff size={21} /><div><strong>{c('offline')}</strong><p>{c('offlineHelp')}</p></div></div>}
  {error && <div className="notice notice-error global-notice" role="alert"><AlertCircle size={21} /><div><p>{error}</p><button className="btn btn-quiet" onClick={() => void initialize()}>{c('retry')}</button></div></div>}
  <PwaNotice />
  <main id="main" tabIndex={-1}><Outlet /></main>
 </div>;
}
