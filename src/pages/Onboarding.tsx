import { useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCopy } from '../utils/copy';
export function Onboarding() {
 const c=useCopy(); const navigate=useNavigate(); const complete=useAppStore(s=>s.setHasOnboarded);
 return <div className="page onboarding"><ScanLine size={54}/><h1>{c('welcome')}</h1><p>{c('homeIntro')}</p><p className="muted">{c('limit')}</p><div className="actions"><button className="btn btn-primary" onClick={()=>{complete(true);navigate('/scanner');}}>{c('scanProduct')}</button><button className="btn btn-quiet" onClick={()=>{complete(true);navigate('/');}}>{c('home')}</button></div></div>;
}
