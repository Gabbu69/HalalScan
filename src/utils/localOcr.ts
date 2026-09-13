export async function extractTextFromImage(image: string, signal?: AbortSignal) {
 const { createWorker } = await import('tesseract.js');
 if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
 const worker = await createWorker('eng');
 let terminated = false;
 const terminate = () => { if(!terminated) {terminated=true; void worker.terminate();} };
 signal?.addEventListener('abort', terminate, {once:true});
 const timer = setTimeout(terminate,40000);
 try {
  if(signal?.aborted) throw new DOMException('Cancelled','AbortError');
  const result = await worker.recognize(image);
  return result.data.text.trim();
 } finally { clearTimeout(timer); signal?.removeEventListener('abort',terminate); terminate(); }
}
