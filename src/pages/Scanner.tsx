import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, ScanLine, Type, Upload, X, Image as ImageIcon } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';
import { useAppStore } from '../store/useAppStore';
import { useCopy } from '../utils/copy';
import { useOnline } from '../hooks/useOnline';
import { validBarcode, validateLabelFile, readLabelFile, preparePhoto } from '../utils/scanInput';
import { fetchJson } from '../utils/requests';
import { hasUsableIngredients } from '../../shared/verdict';
export function Scanner() {
 const c = useCopy(); const navigate = useNavigate(); const [params] = useSearchParams(); const online = useOnline();
 const prior = useAppStore(s => s.draft);
 const [mode,setMode] = useState<'barcode'|'photo'|'text'>(params.get('mode') === 'text' ? 'text' : params.get('mode') === 'photo' ? 'photo' : 'barcode');
 const [barcode,setBarcode] = useState(prior?.barcode || ''); const [text,setText] = useState(prior?.text || '');
 const [name,setName] = useState(prior?.name || ''); const [preview,setPreview] = useState<string|null>(null);
 const [review,setReview] = useState(false); const [reading,setReading] = useState(false);
 const [camera,setCamera] = useState<'off'|'starting'|'on'>('off'); const [error,setError] = useState('');
 const scanner = useRef<Html5Qrcode|null>(null); const session = useRef(0); const detected = useRef(false);
 const ocr = useRef<AbortController|null>(null); const input = useRef<HTMLInputElement>(null); const mounted = useRef(true);
 const setDraft = useAppStore(s => s.setDraft); const setBusy = useAppStore(s => s.setBusy);
 const stop = async () => {
  session.current++; const active = scanner.current; scanner.current = null;
  try { if(active?.isScanning) await active.stop(); active?.clear(); } catch { /* track already released */ }
  if(mounted.current) { setCamera('off'); setBusy(false); }
 };
 useEffect(() => { mounted.current=true; return () => {mounted.current=false; void stop(); ocr.current?.abort(); setBusy(false);}; }, []);
 // Preserve reviewed text across navigation/refresh. Raw photos never enter session storage.
 useEffect(() => {
  if(text || barcode || name) setDraft({id: prior?.id || crypto.randomUUID(),mode,text,barcode,name});
 }, [text,barcode,name,mode]);
 const submitBarcode = async (value: string) => {
  const clean=value.replace(/\s/g,'');
  if(!validBarcode(clean)) {setError(c('invalidBarcode'));return;}
  if(detected.current) return; detected.current=true;
  await stop(); setDraft({id:crypto.randomUUID(),mode:'barcode',barcode:clean}); navigate('/analysis');
 };
 const start = async () => {
  if(camera !== 'off') return;
  const token=++session.current; setError(''); setBusy(true); setCamera('starting'); detected.current=false;
  let instance: Html5Qrcode | null = null;
  try {
   const {Html5Qrcode,Html5QrcodeSupportedFormats:F} = await import('html5-qrcode');
   if(token!==session.current || !mounted.current) return;
   instance=new Html5Qrcode('reader',{formatsToSupport:[F.EAN_13,F.EAN_8,F.UPC_A],verbose:false}); scanner.current=instance;
   await instance.start({facingMode:'environment'},{fps:8,qrbox:{width:240,height:140}},value => { if(token===session.current && validBarcode(value)) void submitBarcode(value); },() => {});
   if(token!==session.current || !mounted.current) {if(instance.isScanning) await instance.stop();instance.clear();return;}
   setCamera('on');
  } catch {
   try {if(instance?.isScanning) await instance.stop();instance?.clear();} catch {}
   if(token===session.current && mounted.current) {scanner.current=null;setCamera('off');setBusy(false);setError(c('cameraError'));}
  }
 };
 const cancelOcr = () => {ocr.current?.abort();ocr.current=null;setReading(false);setBusy(false);};
 const changeMode = (value: typeof mode) => {void stop();cancelOcr();setError('');setMode(value);};
 const chooseFile = async (file?: File) => {
  if(!file) return; cancelOcr(); const request = new AbortController(); ocr.current=request;
  setError(''); setReview(false); setPreview(null); setReading(true); await stop(); setBusy(true);
  try {
   if(!await validateLabelFile(file)) {setError(c('invalidFile'));return;}
   const raw = await readLabelFile(file); const isPdf = file.type==='application/pdf';
   const dataUrl = isPdf ? raw : await preparePhoto(raw); if(request.signal.aborted) return;
   setPreview(isPdf ? null : dataUrl); let extracted='';
   if(online) {
    try { const result=await fetchJson('/api/ocr',{method:'POST',body:JSON.stringify({fileBase64:dataUrl,mimeType:isPdf ? file.type : 'image/jpeg',filename:file.name}),signal:request.signal},18000); extracted=typeof result.text==='string' ? result.text : ''; } catch { /* review and local fallback below */ }
   }
   if(!extracted && !isPdf && !request.signal.aborted && online) {
    try { const {extractTextFromImage}=await import('../utils/localOcr'); extracted=await extractTextFromImage(dataUrl,request.signal); } catch {}
   }
   if(request.signal.aborted || !mounted.current) return;
   setText(extracted.slice(0,10000)); setReview(true);
   if(!hasUsableIngredients(extracted)) setError(c('noOcr'));
  } catch { if(!request.signal.aborted && mounted.current) {setError(c('noOcr'));setReview(true);} }
  finally {if(!request.signal.aborted && mounted.current) {setReading(false);setBusy(false);} if(input.current) input.current.value='';}
 };
 const submitText = () => {
  if(!hasUsableIngredients(text) || text.length>10000) {setError(c('invalidIngredients'));return;}
  setDraft({id:crypto.randomUUID(),mode:mode==='photo'?'photo':'text',text:text.trim(),name:name.trim(),image:preview}); navigate('/analysis');
 };
 return <div className="page page-narrow"><div className="page-heading"><h1>{c('scanTitle')}</h1><p>{c('scanHelp')}</p></div>
  <div className="scan-tabs" role="tablist" aria-label={c('scan')}>
   {([['barcode','barcode',ScanLine],['photo','photo',Camera],['text','ingredients',Type]] as const).map(([value,label,Icon]) => <button key={value} role="tab" id={'tab-'+value} aria-controls="scan-input" aria-selected={mode===value} onClick={() => changeMode(value)}><Icon size={19}/>{c(label)}</button>)}
  </div>
  <div id="scan-input" role="tabpanel" aria-labelledby={'tab-'+mode} className="form-grid">
   {mode==='barcode' && <><div className="camera-area"><div id="reader" />{camera==='off' && <><ScanLine size={44}/><h2>{c('cameraTitle')}</h2><p>{c('cameraHelp')}</p></>}{camera==='off' ? <button className="btn" onClick={() => void start()}><Camera size={20}/>{c('startCamera')}</button> : <button className="btn" onClick={() => void stop()}><X size={18}/>{c(camera==='starting'?'starting':'stopCamera')}</button>}</div>
    <form className="form-grid" onSubmit={e => {e.preventDefault();void submitBarcode(barcode);}}><div className="field"><label htmlFor="barcode">{c('manualBarcode')}</label><input id="barcode" className="input" inputMode="numeric" autoComplete="off" maxLength={20} value={barcode} onChange={e => {setBarcode(e.target.value);detected.current=false;}} placeholder="0123456789012" /></div><button className="btn btn-primary" type="submit" disabled={!online}>{c('lookup')}</button></form></>}
   {mode==='photo' && <><div className="upload-area"><ImageIcon size={36}/><h2>{c('photoTitle')}</h2><p>{c('photoHelp')}</p><input ref={input} className="sr-only" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => void chooseFile(e.target.files?.[0])} aria-label={c('choosePhoto')}/><button className="btn btn-secondary" onClick={() => input.current?.click()} disabled={reading}><Upload size={19}/>{c('choosePhoto')}</button><p className="small">{c('fileHelp')}</p></div>
    {reading && <div role="status"><strong>{c('reading')}</strong><div className="progress-line"/><button className="btn btn-secondary" onClick={cancelOcr}>{c('cancel')}</button></div>}
    {preview && <img className="photo-preview" src={preview} alt={c('photo')}/>}
   </>}
   {(mode==='text' || (mode==='photo' && review && !reading)) && <form className="form-grid" onSubmit={e => {e.preventDefault();submitText();}}>
    {mode==='photo' && <div><h2>{c('reviewText')}</h2><p className="muted spaced">{c('reviewHelp')}</p></div>}
    <div className="field"><label htmlFor="product-name">{c('productName')}</label><input id="product-name" className="input" value={name} maxLength={160} onChange={e => setName(e.target.value)}/></div>
    <div className="field"><label htmlFor="ingredients">{c('ingredientLabel')}</label><textarea id="ingredients" className="input" value={text} maxLength={10000} onChange={e => setText(e.target.value)} placeholder={c('ingredientPlaceholder')} aria-describedby="ingredient-help"/><p className="field-help" id="ingredient-help">{c('englishEvidence')}</p></div>
    <button type="submit" className="btn btn-primary">{c('analyze')}</button>
   </form>}
   {error && <p className="notice notice-warning" role="alert">{error}</p>}
   {(text || barcode || name) && <button className="btn btn-quiet" onClick={() => {cancelOcr();void stop();setDraft(null);navigate('/');}}>{c('cancel')}</button>}
   <p className="field-help">{c('limit')}</p>
  </div>
 </div>;
}
