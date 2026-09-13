import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useCopy } from '../utils/copy';
import { InstallApp } from '../components/PwaNotice';
export function Profile() {
 const c = useCopy(); const dark=useAppStore(s=>s.isDarkMode); const toggle=useAppStore(s=>s.toggleDarkMode);
 const language=useAppStore(s=>s.language); const setLanguage=useAppStore(s=>s.setLanguage); const reset=useAppStore(s=>s.resetData);
 return <div className="page page-narrow"><div className="page-heading"><h1>{c('settings')}</h1></div>
  <section className="settings-section"><h2>{c('appearance')}</h2><div className="setting-row"><label id="dark-label">{c('darkMode')}</label><button className="switch" role="switch" aria-checked={dark} aria-labelledby="dark-label" onClick={toggle}><span/></button></div>
  <div className="setting-row"><label htmlFor="language">{c('language')}</label><select id="language" className="input" style={{width:'auto'}} value={language} onChange={e=>setLanguage(e.target.value)}>{['English','Tagalog','Arabic'].map(value=><option key={value}>{value}</option>)}</select></div></section>
  <section className="settings-section"><InstallApp/></section>
  <section className="settings-section"><h2>{c('deviceData')}</h2><p>{c('privacyHelp')}</p><p className="muted spaced">{c('dataHelp')}</p><button className="btn btn-danger spaced" onClick={()=>{if(window.confirm(c('resetConfirm'))) void reset();}}>{c('resetData')}</button></section>
  <section className="settings-section"><h2>{c('about')}</h2><p>{c('limit')}</p><p className="muted spaced">{c('historicalResearch')}</p><Link to="/evaluation" className="btn btn-quiet spaced">{c('research')}</Link></section>
 </div>;
}
