import { AlertCircle, Check, CircleSlash } from 'lucide-react';
import { getVerdictPresentation } from '../utils/verdictPresentation';
import { useCopy } from '../utils/copy';
export function Badge({ verdict, size = 'md' }: { verdict: string; size?: 'md' | 'lg' }) {
 const c = useCopy(); const { tone } = getVerdictPresentation(verdict);
 const Icon = tone === 'halal' ? Check : tone === 'haram' ? CircleSlash : AlertCircle;
 return <span className={'badge verdict-' + tone + (size === 'lg' ? ' badge-large' : '')}><Icon size={size === 'lg' ? 20 : 15} aria-hidden="true" />{c(tone === 'halal' ? 'positive' : tone === 'haram' ? 'negative' : 'uncertain')}</span>;
}
