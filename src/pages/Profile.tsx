import { Globe, Moon, Book, Info, Database } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';

export function Profile() {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode, madhab, setMadhab, language, setLanguage } = useAppStore();

  const handleClearLocalData = () => {
    if (window.confirm(t('profile.reset_confirm'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full mx-auto max-w-md w-full pt-4 font-nunito bg-gradient-to-b from-[#F9F5F0] to-white dark:from-[var(--color-dark-bg)] dark:to-[#122218]">
      <div className="px-5 mb-4">
        <h2 className="font-amiri italic text-2xl text-[#1B6B3A] dark:text-green-400 font-bold">{t('profile.title')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-20 w-full space-y-5">
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
            <div className="flex flex-row gap-2">
              {['English', 'Tagalog', 'Arabic'].map((option) => (
                <button
                  key={option}
                  onClick={() => setLanguage(option)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${language === option ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-md' : 'bg-transparent dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="font-nunito text-[9px] text-gray-500 dark:text-gray-400 mt-3 font-medium">
              {t('profile.language_desc')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-[11px] font-bold text-[#1B6B3A] dark:text-green-400 uppercase mb-4 tracking-wider flex items-center gap-2">
            <Info size={14} /> {t('profile.about')}
          </h3>
          <div className="flex flex-col items-center justify-center my-4">
            <img src="/logo.png" alt="HalalScan Logo" className="w-16 h-16 rounded-2xl shadow-md border-2 border-[#1B6B3A]/20 dark:border-green-400/20 mb-3" />
            <h4 className="font-amiri italic font-bold text-lg text-gray-900 dark:text-white">HalalScan</h4>
          </div>
          <p className="font-nunito text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-center">
            {t('profile.about_desc')}
          </p>
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border-t border-gray-100 dark:border-gray-800 pt-3">
            <span>Version 1.0.0</span>
            <span>Academic Prototype</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-[11px] font-bold text-[#1B6B3A] dark:text-green-400 uppercase mb-3 tracking-wider flex items-center gap-2">
            <Database size={14} /> {t('profile.data')}
          </h3>
          <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
            {t('profile.data_desc')}
          </p>
          <button
            onClick={handleClearLocalData}
            className="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm"
          >
            {t('profile.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
