import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ResultView } from '../components/ResultView';
import { useCopy } from '../utils/copy';
export function SavedAnalysis() {
 const {id} = useParams(); const c = useCopy(); const ready = useAppStore(s => s.historyReady);
 const scan = useAppStore(s => s.scans.find(item => item.id===id));
 if(!ready) return <div className="page" role="status">{c('saving')}</div>;
 if(!scan) return <div className="page page-narrow empty-state"><h1>{c('missingSaved')}</h1><p>{c('missingSavedHelp')}</p><Link to="/history" className="btn btn-primary spaced">{c('saved')}</Link></div>;
 return <ResultView scan={scan}/>;
}
