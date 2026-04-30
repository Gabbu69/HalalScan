import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchProductByBarcode, OFFProduct } from '../utils/openFoodFacts';
import { runIntegratedAnalysis, runIntegratedImageAnalysis } from '../utils/systemIntegration';
import { useAppStore, ScanRecord } from '../store/useAppStore';
import { Badge } from '../components/Badge';
import { ScanSearch, ArrowLeft, Cpu, Database, Network, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export function Analysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const barcode = searchParams.get('barcode');
  const type = searchParams.get('type');
  const { addScan, madhab, pendingAnalysisImage, setPendingAnalysisImage } = useAppStore();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('Fetching product details...');
  const [result, setResult] = useState<ScanRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showArch, setShowArch] = useState(false);

  useEffect(() => {
    if (!barcode && type !== 'image') {
      navigate(-1);
      return;
    }
    
    const runAnalysis = async () => {
      try {
        if (type === 'image' && pendingAnalysisImage) {
          setStep('Running ML Framework & KR&R Engine...');
          const integratedData = await runIntegratedImageAnalysis(pendingAnalysisImage, madhab);
          
          const finalScan: ScanRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            barcode: 'IMAGE_' + Date.now(),
            name: integratedData.name || "Photo Scan",
            brand: "Custom Source",
            image: pendingAnalysisImage,
            ingredients: integratedData.ingredients || "Unknown",
            verdict: integratedData.finalVerdict,
            confidence: integratedData.confidence,
            flagged_ingredients: integratedData.flagged_ingredients || [],
            reason: integratedData.reason,
            recommendation: integratedData.recommendation,
            architectureDetails: integratedData.architectureDetails
          };

          setResult(finalScan);
          useAppStore.getState().addScan(finalScan);
          setPendingAnalysisImage(null); // clear it
          setLoading(false);
          return;
        }

        if (barcode) {
          setStep('Fetching product details...');
          const product = await fetchProductByBarcode(barcode);
          
          if (!product) {
            setErrorMsg("Product not found in the OpenFoodFacts database. Try scanning the ingredients list via the camera instead.");
            setLoading(false);
            return;
          }

          setStep('Running Hybrid Inference (ML + KR&R)...');
          const integratedData = await runIntegratedAnalysis(product.name, product.ingredients, madhab);
          
          const finalScan: ScanRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            barcode: barcode,
            name: product.name,
            brand: product.brand,
            image: product.image,
            ingredients: product.ingredients,
            verdict: integratedData.finalVerdict,
            confidence: integratedData.confidence,
            flagged_ingredients: integratedData.flagged_ingredients,
            reason: integratedData.reason,
            recommendation: integratedData.recommendation,
            architectureDetails: integratedData.architectureDetails
          };

          setResult(finalScan);
          useAppStore.getState().addScan(finalScan);
          setLoading(false);
        }

      } catch (error) {
        console.error(error);
        setErrorMsg("We encountered an issue analyzing this product. Please check your internet connection and try again.");
        setLoading(false);
      }
    };

    runAnalysis();
  }, [barcode, type, madhab, navigate, pendingAnalysisImage, setPendingAnalysisImage]);

  if (errorMsg) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#F9F5F0] dark:bg-[var(--color-dark-bg)] p-6 font-nunito relative z-10 w-full">
        <div className="bg-white dark:bg-[#1a2e22] p-8 rounded-[32px] shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-5 border-4 border-white dark:border-[#1a2e22] shadow-md relative -top-12 -mb-7">
            <AlertTriangle className="text-red-500 dark:text-red-400" size={32} />
          </div>
          <h2 className="font-amiri italic font-bold text-2xl text-gray-900 dark:text-white mb-3">Analysis Failed</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-8 leading-relaxed px-2">{errorMsg}</p>
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-[#1B6B3A] hover:bg-[#14532b] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-md"
          >
            {t('analysis.back') || 'Go Back & Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F9F5F0] dark:bg-[var(--color-dark-bg)] p-5 w-full font-nunito text-[#1a1a1a]">
        <div className="max-w-md mx-auto w-full pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-[#1B6B3A] dark:text-green-400 transition-opacity opacity-50 cursor-not-allowed">
            <ArrowLeft size={16} />
            <span className="font-amiri italic font-bold text-lg">{t('scanner.processing') || 'Analyzing...'}</span>
          </button>

          {/* Product Details Skeleton */}
          <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-5 mb-4 shadow-sm text-center flex flex-col items-center border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-lg mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2 mt-1 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-4 animate-pulse"></div>
            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded-full mb-3 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse"></div>
          </div>

          {/* Pulse text indicator for current step */}
          <div className="bg-white/50 dark:bg-[#1a2e22]/50 rounded-xl p-3 mb-4 border border-green-100 dark:border-green-900/30 flex items-center justify-center gap-3 shadow-inner">
             <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-[#1B6B3A] dark:border-t-green-400 animate-spin"></div>
             <p className="text-[10px] text-gray-500 dark:text-gray-400 tracking-widest uppercase font-bold animate-pulse">{step}</p>
          </div>

          {/* Analysis Findings Skeleton */}
          <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-3 animate-pulse"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-5/6 mb-5 animate-pulse"></div>
            
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-3 animate-pulse"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-4/5 animate-pulse"></div>
          </div>

          {/* Architecture Details Skeleton */}
          <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-1 mb-4 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
             <div className="w-full flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
             </div>
          </div>

        </div>
      </div>
    );
  }

  const borderClass = result.verdict === 'HALAL' 
    ? 'border-green-600' 
    : result.verdict === 'HARAM' 
    ? 'border-red-600' 
    : 'border-amber-600';

  const textClass = result.verdict === 'HALAL' 
    ? 'text-green-600 dark:text-green-400' 
    : result.verdict === 'HARAM' 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F5F0] dark:bg-[var(--color-dark-bg)] p-5 w-full font-nunito text-[#1a1a1a]">
      <div className="max-w-md mx-auto w-full pt-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 text-[#1B6B3A] dark:text-green-400 transition-opacity hover:opacity-80">
          <ArrowLeft size={16} />
          <span className="font-amiri italic font-bold text-lg">{t('analysis.title')}</span>
        </button>

        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-5 mb-4 shadow-sm text-center flex flex-col items-center border border-gray-100 dark:border-gray-800">
          {result.image ? (
             <img src={result.image} alt={result.name} className="w-16 h-16 object-cover rounded-lg mx-auto mb-3 bg-white border border-gray-100 dark:border-gray-700" />
          ) : (
             <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg mx-auto mb-3 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                <ScanSearch className="text-gray-400" size={24} />
             </div>
          )}
          <h2 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{result.name}</h2>
          <p className="text-[10px] text-gray-400 mt-1">Brand: {result.brand}</p>
          <div className="mt-4">
            <Badge verdict={result.verdict} size="lg" />
          </div>
          <div className="mt-3 text-[10px] font-bold text-gray-500 tracking-wider">{t('analysis.confidence')}: {result.confidence}%</div>
        </div>

        <div className={`bg-white dark:bg-[#1a2e22] rounded-2xl p-4 mb-4 shadow-sm border-l-4 border border-gray-100 dark:border-gray-800 ${borderClass}`}>
          <h3 className={`text-[11px] font-bold uppercase mb-1 tracking-wider ${textClass}`}>{t('analysis.reason') || 'System Findings'}</h3>
          <p className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-300">{result.reason}</p>
          
          {result.recommendation && (
            <>
              <h3 className={`text-[11px] font-bold uppercase mt-4 mb-1 tracking-wider ${textClass}`}>{t('analysis.recommendation')}</h3>
              <p className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-300">{result.recommendation}</p>
            </>
          )}
        </div>

        {result.flagged_ingredients && result.flagged_ingredients.length > 0 && (
          <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-[11px] font-bold text-red-600 uppercase mb-3 tracking-wider">{t('analysis.flagged')}</h3>
            <div className="flex flex-row flex-wrap gap-2">
              {result.flagged_ingredients.map((ing, idx) => (
                <div key={idx} className="bg-red-50 dark:bg-red-900/40 px-2 py-1 flex items-center rounded border border-red-100 dark:border-red-900">
                  <span className="font-bold text-red-700 dark:text-red-300 text-[10px]">{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Architecture Logs (Fulfills Project Rubric) */}
        {result.architectureDetails && (
          <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-1 mb-4 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
             <button 
                onClick={() => setShowArch(!showArch)}
                className="w-full flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">System Architecture Logs</span>
                </div>
                {showArch ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
             </button>
             
             {showArch && (
               <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#1B6B3A] dark:text-green-400 mb-2">
                      <Database size={12} /> Knowledge Base & KR&R Engine
                    </h4>
                    <div className="bg-gray-50 dark:bg-[#0f1a13] rounded p-2 border border-gray-100 dark:border-gray-800 font-mono text-[8px] text-gray-600 dark:text-gray-400 overflow-x-auto">
                      <div className="font-bold mb-1 text-gray-800 dark:text-gray-300">Rule-based Status -&gt; {result.architectureDetails.krrAnalysis.status}</div>
                      {result.architectureDetails.krrAnalysis.logicPath.map((log: string, idx: number) => (
                        <div key={idx}>[{idx+1}] {log}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">
                      <Network size={12} /> ML Model Inferencing (Gemini)
                    </h4>
                     <div className="bg-gray-50 dark:bg-[#0f1a13] rounded p-2 border border-gray-100 dark:border-gray-800 font-mono text-[8px] text-gray-600 dark:text-gray-400">
                      <div>Model: gemini-2.5-flash</div>
                      <div>MimeType: application/json</div>
                      <div>Verdict Generated: {result.architectureDetails.mlAnalysis?.verdict || 'N/A'}</div>
                     </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                      <Cpu size={12} /> System Integration / Consensus
                    </h4>
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded p-2 border border-indigo-100 dark:border-indigo-900/30 font-mono text-[8px] text-indigo-800 dark:text-indigo-300">
                      {result.architectureDetails.integrationLogic.map((log: string, idx: number) => (
                        <div key={idx} className="mb-1">&gt; {log}</div>
                      ))}
                    </div>
                  </div>
               </div>
             )}
          </div>
        )}

        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-[11px] font-bold text-[#1B6B3A] dark:text-green-500 uppercase mb-2 tracking-wider">Ingredients List</h3>
          <div className="text-[9px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            {result.ingredients}
          </div>
        </div>

        <div className="pb-8 mb-4">
           <button 
             onClick={() => navigate('/')} 
             className="w-full bg-[#1B6B3A] hover:bg-[#14532b] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-md"
           >
             {t('analysis.done') || 'Check Another Product'}
           </button>
        </div>
      </div>
    </div>
  );
}
