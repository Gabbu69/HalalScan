import { Link } from 'react-router-dom';
import { ScanLine, ArrowRight, CheckCircle2, AlertCircle, CircleSlash, Bookmark, ShieldCheck, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCopy } from '../utils/copy';
import { SavedRow } from '../components/SavedRow';
export function Home() {
 const c = useCopy(); const scans = useAppStore(s => s.scans);
 const onboarded = useAppStore(s => s.hasOnboarded); const complete = useAppStore(s => s.setHasOnboarded);
 return <div className="page">
  {!onboarded && <div className="notice" style={{marginBottom:28}}><ShieldCheck size={22} /><div><strong>{c('welcome')}</strong><p>{c('limit')}</p></div><button className="icon-button" onClick={() => complete(true)} aria-label={c('dismiss')}><X size={18}/></button></div>}
  <section className="hero"><div><h1>{c('homeTitle')}</h1><p>{c('homeIntro')}</p><Link className="btn btn-quiet" to="/scanner?mode=text">{c('typeInstead')}<ArrowRight size={18} /></Link></div>
   <div className="scan-panel"><div className="scan-emblem"><ScanLine size={42} /></div><h2>{c('scanProduct')}</h2><p>{c('scanHelp')}</p><Link to="/scanner" className="btn">{c('scanProduct')}<ArrowRight size={20} /></Link></div>
  </section>
  <div className="home-columns"><section><div className="section-heading"><h2>{c('recent')}</h2><Link to="/history">{c('viewAll')}</Link></div>
   {scans.length ? scans.slice(0,4).map(scan => <SavedRow key={scan.id} scan={scan} compact />) : <div className="empty-state"><Bookmark size={32} strokeWidth={1.5}/><h3>{c('emptyTitle')}</h3><p>{c('emptyIntro')}</p></div>}
   <div className="bottom-note"><ShieldCheck size={19}/><span>{c('privacy')}</span></div>
  </section><section><h2>{c('understand')}</h2><div className="meaning-list">
   {([['positive','positiveHelp',CheckCircle2,'halal'],['uncertain','uncertainHelp',AlertCircle,'review'],['negative','negativeHelp',CircleSlash,'haram']] as const).map(([key,help,Icon,tone]) => <div className="meaning-row" key={key}><Icon size={22} className={'verdict-text-' + tone}/><div><h3>{c(key)}</h3><p>{c(help)}</p></div></div>)}
  </div></section></div>
 </div>;
}
