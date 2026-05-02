import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Search, Camera, Loader2, RefreshCw, X, ImagePlus, RotateCcw, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';

export function Scanner() {
  const [manualBarcode, setManualBarcode] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setPendingAnalysisImage } = useAppStore();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

        // Prefer back camera
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            html5QrCode.stop().then(() => {
              navigate(`/analysis?barcode=${decodedText}`);
            }).catch(() => {
              navigate(`/analysis?barcode=${decodedText}`);
            });
          },
          (errorMessage) => {
            // parse error, ignore
          }
        );
        
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

  // Capture a frame directly from the live video stream
  const handleSnapFromStream = useCallback(() => {
    const readerEl = document.getElementById('reader');
    const videoEl = readerEl?.querySelector('video');

    if (!videoEl || videoEl.readyState < 2) {
      // Fallback: if video isn't ready, show an alert
      alert(t('scanner.camera_not_ready') || 'Camera is not ready yet. Please wait a moment.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas to full video resolution for best quality
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.92);

    setCapturedImage(base64);
  }, [t]);

  // Handle gallery file selection (no capture attribute — opens gallery)
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  // Confirm the captured/uploaded image and navigate to analysis
  const handleConfirmImage = () => {
    if (!capturedImage) return;
    setIsProcessingImage(true);
    setPendingAnalysisImage(capturedImage);
    setTimeout(() => {
      navigate('/analysis?type=image');
    }, 300);
  };

  // Discard and go back to live view
  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualBarcode.trim().length < 3) {
      alert("Enter a valid barcode");
      return;
    }
    navigate(`/analysis?barcode=${manualBarcode.trim()}`);
  };

  const retryScanner = () => {
    window.location.reload();
  };

  // ── Photo Preview Screen ──
  if (capturedImage) {
    return (
      <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
        {/* Preview Image */}
        <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center">
          <img
            src={capturedImage}
            alt="Captured preview"
            className="max-w-full max-h-full object-contain"
          />

          {/* Subtle vignette overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)'
          }} />
        </div>

        {/* Preview Actions */}
        <div className="absolute bottom-0 left-0 w-full p-6 pt-8 bg-[#1a1a1a]/95 backdrop-blur-md rounded-t-[32px] border-t border-white/10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20 flex flex-col gap-4">
          <p className="text-center text-[10px] font-bold tracking-widest uppercase text-white/50">
            {t('scanner.review_photo') || 'Review Your Photo'}
          </p>

          <div className="flex gap-3">
            {/* Retake */}
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-4 rounded-2xl font-bold tracking-wider transition-all active:scale-[0.97] uppercase text-xs border border-white/10"
            >
              <RotateCcw size={18} />
              <span>{t('scanner.retake') || 'Retake'}</span>
            </button>

            {/* Analyze */}
            <button
              onClick={handleConfirmImage}
              disabled={isProcessingImage}
              className="flex-[2] flex items-center justify-center gap-2 bg-[#1B6B3A] hover:bg-[#14532b] text-white py-4 rounded-2xl font-bold tracking-wider transition-all disabled:opacity-70 shadow-lg shadow-[#1B6B3A]/30 border border-[#1B6B3A]/50 active:scale-[0.97] uppercase text-xs"
            >
              {isProcessingImage ? (
                <>
                  <Loader2 size={18} className="animate-spin text-[#C9A84C]" />
                  <span>{t('scanner.processing_photo') || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Check size={18} className="text-[#C9A84C]" />
                  <span>{t('scanner.analyze') || 'Analyze Photo'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Scanner Screen ──
  return (
    <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden gallery input — NO capture attribute so it opens the photo gallery */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={galleryInputRef}
        onChange={handleGalleryUpload}
      />
      
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
      <div className="absolute bottom-0 left-0 w-full p-6 pt-8 bg-[#1a1a1a]/95 backdrop-blur-md rounded-t-[32px] border-t border-white/10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20 flex flex-col gap-4">
        
        {/* Primary: Snap from live camera */}
        <button 
          onClick={handleSnapFromStream}
          disabled={!isScannerReady || isProcessingImage}
          className="w-full flex items-center justify-center gap-3 bg-[#1B6B3A] hover:bg-[#14532b] text-white py-4 rounded-2xl font-bold tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-[#1B6B3A]/30 border border-[#1B6B3A]/50 active:scale-[0.98] uppercase text-xs"
        >
          <Camera size={20} className="text-[#C9A84C]" />
          <span>{t('scanner.snap_photo') || 'Snap Ingredients Photo'}</span>
        </button>

        {/* Secondary: Upload from gallery */}
        <button 
          onClick={() => galleryInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 text-white py-3.5 rounded-2xl font-bold tracking-wider transition-all active:scale-[0.98] uppercase text-xs border border-white/10"
        >
          <ImagePlus size={18} className="text-[#C9A84C]" />
          <span>{t('scanner.upload_gallery') || 'Upload from Gallery'}</span>
        </button>

        <div className="flex items-center gap-3 w-full">
           <div className="h-px bg-white/10 flex-1"></div>
           <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">{t('scanner.or_enter_barcode') || 'Or Enter Barcode'}</span>
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
