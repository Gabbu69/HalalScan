import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Globe, Moon, Book, ShieldCheck, Key, Info, User, Mail, Camera, Edit2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export function Profile() {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode, madhab, setMadhab, language, setLanguage, userProfile, updateUserProfile } = useAppStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key_override') || '');
  const [saved, setSaved] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editEmail, setEditEmail] = useState(userProfile.email);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key_override', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key_override');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProfile = () => {
    updateUserProfile({ name: editName, email: editEmail });
    setIsEditingProfile(false);
  };

  const handleClearCache = () => {
    if (window.confirm(t('profile.reset_confirm'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full mx-auto max-w-md w-full pt-4 font-nunito bg-gradient-to-b from-[#F9F5F0] to-white dark:from-[var(--color-dark-bg)] dark:to-[#122218]">
      <div className="px-5 mb-4 flex justify-between items-center">
        <h2 className="font-amiri italic text-2xl text-[#1B6B3A] dark:text-green-400 font-bold">{t('profile.title')}</h2>
        {!isEditingProfile && (
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] hover:text-[#a88a38] transition-colors bg-[#C9A84C]/10 px-3 py-1.5 rounded-full"
          >
            <Edit2 size={12} /> {t('profile.edit')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-20 w-full space-y-5">

        {/* User Profile Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#1a2e22] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#1B6B3A] to-[#124d29] opacity-90"></div>
          
          <div className="relative z-10 w-24 h-24 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-[#1a2e22] shadow-lg flex items-center justify-center mb-4 mt-4 overflow-hidden group">
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-gray-400 dark:text-gray-500" />
            )}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
            >
              <Camera size={24} className="text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {isEditingProfile ? (
            <div className="w-full space-y-3 mt-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">{t('profile.fullname')}</label>
                <input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1a13] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#1B6B3A] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">{t('profile.email')}</label>
                <input 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1a13] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#1B6B3A] transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('profile.cancel')}
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#1B6B3A] text-white shadow-md hover:bg-[#15542d] transition-colors"
                >
                  {t('profile.save')}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full mt-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userProfile.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5 mt-1">
                <Mail size={14} /> {userProfile.email}
              </p>
            </div>
          )}
        </div>

        {/* Personalization Section */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-[11px] font-bold text-[#1B6B3A] dark:text-green-400 uppercase mb-4 tracking-wider flex items-center gap-2">
             <Moon size={14} /> {t('profile.preferences')}
          </h3>
          
          <div className="flex flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{t('profile.dark_mode')}</span>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${isDarkMode ? 'bg-[#1B6B3A]' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="py-2">
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Book size={16} className="text-gray-400" /> {t('profile.dietary')}
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-2">
                <button
                  onClick={() => setMadhab("Shafi'i")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${madhab === "Shafi'i" || madhab === "Shafii" ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-md' : 'bg-transparent dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                >
                  Shafi'i
                </button>
                <button
                  onClick={() => setMadhab('Hanafi')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${madhab === 'Hanafi' ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-md' : 'bg-transparent dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                >
                  Hanafi
                </button>
              </div>
              <button
                onClick={() => setMadhab('General')}
                className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${madhab === 'General' ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-md' : 'bg-transparent dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
              >
                {t('profile.general')}
              </button>
            </div>
            <p className="font-nunito text-[9px] text-gray-500 dark:text-gray-400 mt-3 font-medium">
              {t('profile.dietary_desc')}
            </p>
          </div>

          <div className="py-2 border-t border-gray-100 dark:border-gray-800 mt-2">
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3 mt-2">
              <Globe size={16} className="text-gray-400" /> {t('profile.language')}
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-2">
                <button
                  onClick={() => setLanguage('English')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${language === 'English' ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-md' : 'bg-transparent dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('Tagalog')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${language === 'Tagalog' ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-md' : 'bg-transparent dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                >
                  Tagalog
                </button>
                <button
                  onClick={() => setLanguage('Arabic')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${language === 'Arabic' ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-md' : 'bg-transparent dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                >
                  Arabic
                </button>
              </div>
            </div>
            <p className="font-nunito text-[9px] text-gray-500 dark:text-gray-400 mt-3 font-medium">
              {t('profile.language_desc')}
            </p>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-[11px] font-bold text-[#1B6B3A] dark:text-green-400 uppercase mb-3 tracking-wider flex items-center gap-2">
            <Key size={14} /> {t('profile.api_key')}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
            {t('profile.api_key_desc')}
          </p>
          <div className="flex flex-col gap-2">
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              type="password"
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1a13] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#1B6B3A] transition-colors font-mono"
            />
            <button 
              onClick={handleSaveKey}
              className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm ${saved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {saved ? t('profile.saved') : t('profile.save_key')}
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
           <h3 className="text-[11px] font-bold text-[#1B6B3A] dark:text-green-400 uppercase mb-4 tracking-wider flex items-center gap-2">
             <Info size={14} /> {t('profile.about')}
          </h3>
          <div className="flex flex-col items-center justify-center my-4">
             <ShieldCheck size={32} className="text-[#1B6B3A] dark:text-green-400 mb-2" />
             <h4 className="font-amiri italic font-bold text-lg text-gray-900 dark:text-white">HalalScan</h4>
          </div>
          <p className="font-nunito text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-center">
            {t('profile.about_desc')}
          </p>
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border-t border-gray-100 dark:border-gray-800 pt-3">
             <span>Version 1.0.0</span>
             <span>BARMM Region</span>
          </div>
        </div>

        {/* Reset Section */}
        <div className="pt-2">
          <button 
            onClick={handleClearCache} 
            className="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm"
          >
            {t('profile.reset')}
          </button>
        </div>

      </div>
    </div>
  );
}
