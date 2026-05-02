import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ScanLine, Search, CheckCircle2, XCircle, AlertTriangle, User, MapPin, Navigation, Info } from 'lucide-react';
import { Badge } from '../components/Badge';
import { useTranslation } from '../hooks/useTranslation';

export function Home() {
  const { scans, getStats, userLocation, setUserLocation, locationPermissionStatus, setLocationPermissionStatus } = useAppStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const stats = getStats();
  const recentScans = scans.slice(0, 5);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const requestLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationPermissionStatus('granted');
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error fetching location", error);
        setLocationPermissionStatus('denied');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const nearbyRetailers = [
    { id: 1, name: "Al-Barakah Meat Market", distance: "0.8 km", type: "Butcher", rating: 4.8 },
    { id: 2, name: "Medina Supermarket", distance: "1.2 km", type: "Grocery", rating: 4.5 },
  ];

  return (
    <div className="p-5 pb-8 max-w-md mx-auto h-full flex flex-col pt-6">
      <div className="flex justify-between items-center mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
          {useAppStore.getState().madhab === 'General' ? t('home.greeting_general') : t('home.greeting')}
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors"
          title="Go to profile"
        >
          <User size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-[#1a2e22] p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-start justify-center">
          <div className="text-[10px] text-gray-400 uppercase whitespace-nowrap font-bold tracking-wider">Total Scans</div>
          <div className="text-2xl font-bold text-[#1B6B3A] dark:text-green-400">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-[#1a2e22] p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-start justify-center">
          <div className="text-[10px] text-gray-400 uppercase whitespace-nowrap font-bold tracking-wider">Halal Count</div>
          <div className="text-2xl font-bold text-[#1B6B3A] dark:text-green-400">{stats.halal}</div>
        </div>
      </div>

      {/* Nearby Retailers Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-tighter">Nearby Halal Retailers</h3>
          {locationPermissionStatus === 'granted' && (
            <div className="flex items-center gap-1 text-[9px] text-[#1B6B3A] dark:text-green-400 font-bold">
               <MapPin size={8} />
               <span>Live Location</span>
            </div>
          )}
        </div>

        {locationPermissionStatus === 'granted' ? (
          <div className="space-y-2">
            {nearbyRetailers.map(retailer => (
              <div key={retailer.id} className="bg-white dark:bg-[#1a2e22] p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-[#1B6B3A] dark:text-green-400">
                  <Navigation size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{retailer.name}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{retailer.type} • {retailer.distance}</div>
                </div>
                <div className="text-[10px] font-bold text-[#C9A84C]">★ {retailer.rating}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1a2e22] p-4 rounded-2xl shadow-sm border border-dashed border-gray-200 dark:border-gray-700 text-center">
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin size={18} className="text-gray-300 dark:text-gray-600" />
            </div>
            <div className="text-[10px] font-bold text-gray-600 dark:text-gray-300 mb-1">Find Verified Halal Meat Nearby</div>
            <p className="text-[9px] text-gray-400 mb-3 px-4 leading-normal">Allow location access to find verified butchers and certified retailers near you.</p>
            <button 
              onClick={requestLocation}
              disabled={loadingLocation}
              className="px-4 py-1.5 bg-[#C9A84C] text-[#1B6B3A] text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
            >
              {loadingLocation ? 'Requesting...' : 'Enable Location'}
            </button>
            {locationPermissionStatus === 'denied' && (
              <p className="mt-2 text-[8px] text-red-500 font-bold uppercase">Permission Denied in Browser</p>
            )}
          </div>
        )}
      </div>

      {/* Main Action */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8 mt-2">
        <button 
          onClick={() => navigate('/scanner')}
          className="w-32 h-32 rounded-full bg-[#1B6B3A] border-4 border-[#C9A84C] flex items-center justify-center shadow-lg shadow-[#1B6B3A]/30 mb-4 transition-transform hover:scale-105 active:scale-95"
        >
          <ScanLine size={48} className="text-white" />
        </button>
        <div className="text-center">
          <h2 className="font-amiri italic text-xl text-[#1B6B3A] dark:text-green-400 font-bold tracking-wide">{t('home.scan_product')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.scan_desc')}</p>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="mb-2">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-tighter">{t('home.recent_scans')}</h3>
        {recentScans.length === 0 ? (
           <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 py-8 flex flex-col items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800">
             <Search size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
             <div className="text-xs text-gray-400 font-medium">{t('home.no_scans')}</div>
           </div>
        ) : (
          <div className="space-y-2">
            {recentScans.map(scan => {
              const isHalal = scan.verdict === 'HALAL' || scan.verdict === 'HALAL COMPLIANT';
              const isHaram = scan.verdict === 'HARAM' || scan.verdict === 'NON-COMPLIANT';
              const Icon = isHalal ? CheckCircle2 : isHaram ? XCircle : AlertTriangle;
              const iconBg = isHalal ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : isHaram ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400';
              return (
                <div key={scan.id} className="bg-white dark:bg-[#1a2e22] p-2 rounded-lg flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a2e22]/80 transition-colors" onClick={() => navigate('/history')}>
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon size={16} className="currentColor" />
                  </div>
                  <div className="flex-1 overflow-hidden pr-2">
                    <div className="text-[10px] sm:text-xs font-bold truncate text-gray-900 dark:text-white leading-tight">{scan.name}</div>
                  </div>
                  <Badge verdict={scan.verdict} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
