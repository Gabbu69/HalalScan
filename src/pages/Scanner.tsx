import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Search, Camera, Loader2, RefreshCw, X, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';

export function Scanner() {
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualText, setManualText] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageProcessingStep, setImageProcessingStep] = useState('Processing Photo...');
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [reviewOcrText, setReviewOcrText] = useState('');
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setPendingAnalysisImage, setPendingAnalysisImageOcrText, setPendingAnalysisText } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const readerId = "reader";
    
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        const successCallback = (decodedText: string) => {
          html5QrCode.stop().then(() => {
            navigate(`/analysis?barcode=${decodedText}`);
          }).catch(() => {
            navigate(`/analysis?barcode=${decodedText}`);
          });
        };

        const errorCallback = (errorMessage: string) => {
          // parse error, ignore
        };

        try {
          // Try preferred back camera first
          await html5QrCode.start({ facingMode: "environment" }, config, successCallback, errorCallback);
        } catch (envErr) {
          console.log("Environment camera failed, falling back to any available camera:", envErr);
          // If environment fails (e.g. on laptops), get all cameras and use the first one
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            await html5QrCode.start(devices[0].id, config, successCallback, errorCallback);
          } else {
            throw new Error("No cameras found on device");
          }
        }
        
        setIsScannerReady(true);
        setScannerError(null);
      } catch (err) {
        console.error("Scanner start error:", err);
        setScannerError(t('scanner.error_permissions') || "Could not start camera. Please ensure camera permissions are granted.");
      }
    };

    // Delay initialization slightly to ensure element is in DOM
    const timer = setTimeout(startScanner, 500);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Error stopping scanner", e));
      }
    };
  }, [navigate]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualBarcode.trim().length < 3) {
      alert("Enter a valid barcode");
      return;
    }
    navigate(`/analysis?barcode=${manualBarcode.trim()}`);
  };

  const handleManualTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualText.trim().length < 2) {
      alert("Enter valid ingredients list");
      return;
    }
    setPendingAnalysisText(manualText.trim());
    navigate('/analysis?type=text');
  };

  const clearPhotoReview = () => {
    setShowOcrReview(false);
    setReviewOcrText('');
    setReviewImagePreview(null);
    setPendingAnalysisImage(null);
    setPendingAnalysisImageOcrText(null);
    setIsProcessingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeReviewedPhoto = () => {
    setPendingAnalysisImageOcrText(reviewOcrText.trim() || null);
    navigate('/analysis?type=image');
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowOcrReview(false);
    setReviewOcrText('');
    setReviewImagePreview(null);
    setIsProcessingImage(true);
    setImageProcessingStep('Preparing Photo...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      // Compress image to ensure it fits under Vercel's 4.5MB payload limit
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        let compressedBase64 = base64;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setPendingAnalysisImage(compressedBase64);
        } else {
          // Fallback if canvas fails
          setPendingAnalysisImage(base64);
        }
        setReviewImagePreview(compressedBase64);

        setPendingAnalysisImageOcrText(null);
        setImageProcessingStep('Reading Label Text...');
        let extractedReviewText = '';
        try {
          const { extractTextFromImage } = await import('../utils/localOcr');
          const ocrText = await extractTextFromImage(compressedBase64);
          const fileNameText = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
          extractedReviewText = [ocrText, fileNameText].filter(Boolean).join(' ').trim();
        } catch (ocrError) {
          console.warn('Local OCR failed, Gemini/offline fallback will handle image analysis:', ocrError);
          extractedReviewText = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
        }

        setReviewOcrText(extractedReviewText);
        setPendingAnalysisImageOcrText(extractedReviewText || null);
        setShowOcrReview(true);
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        console.warn('Could not load selected image for analysis.');
        setIsProcessingImage(false);
        setScannerError('Could not read the selected image. Try another photo.');
      };
      img.src = base64;
    };
    reader.onerror = () => {
      console.warn('Could not read selected image file.');
      setIsProcessingImage(false);
      setScannerError('Could not read the selected image. Try another photo.');
    };
    reader.readAsDataURL(file);
  };

  const retryScanner = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto w-full bg-black text-white relative overflow-hidden sm:shadow-2xl sm:border-x sm:border-white/10">
      
      {/* Scanner Wrapper */}
      <div className="flex-1 relative w-full h-full bg-black">
        <div id="reader" className="absolute inset-0 [&_video]:!object-cover"></div>
        
        {/* Loading/Error State */}
        {!isScannerReady && !scannerError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
            <Loader2 size={40} className="animate-spin text-[#C9A84C] mb-4" />
            <p className="text-sm font-bold tracking-widest uppercase opacity-60">{t('scanner.initializing') || 'Initializing Camera...'}</p>
          </div>
        )}

        {scannerError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Camera size={32} className="text-red-500" />
            </div>
            <p className="text-sm font-bold mb-6">{scannerError}</p>
            <button 
              onClick={retryScanner}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-xs uppercase"
            >
              <RefreshCw size={16} />
              {t('scanner.retry_camera') || 'Retry Camera'}
            </button>
          </div>
        )}
        
        {/* Target Marker Overlay */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[250px] h-[250px] pointer-events-none z-10">
          {/* Animated Corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#C9A84C] opacity-80 rounded-tl-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#C9A84C] opacity-80 rounded-tr-xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#C9A84C] opacity-80 rounded-bl-xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#C9A84C] opacity-80 rounded-br-xl animate-pulse"></div>
          
          {/* Sweeping Laser Line */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 shadow-[0_0_12px_rgba(74,222,128,1)] animate-scan"></div>
        </div>

        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center z-30"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 w-full p-6 pt-8 bg-[#1a1a1a]/95 backdrop-blur-md rounded-t-[32px] border-t border-white/10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20 flex flex-col gap-5">
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleCapturePhoto}
        />

        {showOcrReview ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {reviewImagePreview && (
                <img
                  src={reviewImagePreview}
                  alt="Ingredient label"
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-black/40"
                />
              )}
              <textarea
                className="min-h-24 flex-1 resize-none bg-white/10 rounded-xl px-4 py-3 font-nunito text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all text-xs leading-relaxed backdrop-blur-md"
                placeholder="Extracted ingredients..."
                value={reviewOcrText}
                onChange={(e) => setReviewOcrText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={clearPhotoReview}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-bold tracking-wider transition-all uppercase text-[10px]"
              >
                <Camera size={16} className="text-[#C9A84C]" />
                Retake
              </button>
              <button
                type="button"
                onClick={handleAnalyzeReviewedPhoto}
                disabled={!reviewImagePreview}
                className="flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#b09341] text-[#1B6B3A] py-3 rounded-xl font-bold tracking-wider transition-all disabled:opacity-50 uppercase text-[10px]"
              >
                <Check size={16} />
                Analyze
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
              className="w-full flex items-center justify-center gap-3 bg-[#1B6B3A] hover:bg-[#14532b] text-white py-4 rounded-2xl font-bold tracking-wider transition-all disabled:opacity-70 shadow-lg shadow-[#1B6B3A]/30 border border-[#1B6B3A]/50 active:scale-[0.98] uppercase text-xs"
            >
              {isProcessingImage ? (
                <>
                  <Loader2 size={20} className="animate-spin text-[#C9A84C]" />
                  <span className="text-white">{imageProcessingStep}</span>
                </>
              ) : (
                <>
                  <Camera size={20} className="text-[#C9A84C]" />
                  <span>{t('scanner.snap_photo') || 'Snap Ingredients Photo'}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3 w-full">
               <div className="h-px bg-white/10 flex-1"></div>
               <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">{t('scanner.or_enter_barcode') || 'Barcode or Text'}</span>
               <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-row relative">
              <input
                className="flex-1 bg-white/10 rounded-xl px-4 py-3.5 font-nunito text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all text-sm backdrop-blur-md"
                placeholder={t('scanner.placeholder') || "e.g. 3017620..."}
                type="number"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#C9A84C] hover:bg-[#b09341] px-5 rounded-lg transition-colors flex items-center justify-center text-[#1B6B3A] shadow-md disabled:opacity-40"
                disabled={!manualBarcode.trim()}
              >
                <Search size={20} className="stroke-[3]" />
              </button>
            </form>

            <form onSubmit={handleManualTextSubmit} className="flex flex-row relative mt-1">
              <input
                className="flex-1 bg-white/10 rounded-xl px-4 py-3.5 font-nunito text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all text-sm backdrop-blur-md"
                placeholder="Paste ingredients for offline analysis..."
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#C9A84C] hover:bg-[#b09341] px-5 rounded-lg transition-colors flex items-center justify-center text-[#1B6B3A] shadow-md disabled:opacity-40"
                disabled={!manualText.trim()}
              >
                <Search size={20} className="stroke-[3]" />
              </button>
            </form>
          </>
        )}

        <button 
          className="w-full py-2 mt-1 text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors"
          onClick={() => navigate(-1)} 
        >
          {t('scanner.cancel_return') || 'Cancel & Return'}
        </button>
      </div>
    </div>
  );
}
