import { useEffect } from "react";
import { create } from "zustand";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Download, RefreshCw, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useCopy } from "../utils/copy";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const useInstall = create<{
  event: InstallEvent | null;
  set: (event: InstallEvent | null) => void;
}>((set) => ({ event: null, set: (event) => set({ event }) }));
export function PwaNotice() {
  const c = useCopy();
  const busy = useAppStore((s) => s.busy || !!s.draft);
  const setInstall = useInstall((s) => s.set);
  const {
    offlineReady: [ready, setReady],
    needRefresh: [refresh, setRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const install = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  if (!refresh && !ready) return null;
  return (
    <div className="notice global-notice" role="status">
      <RefreshCw size={21} />
      <div>
        <strong>{c(refresh ? "updateReady" : "offlineReady")}</strong>
        {refresh && busy && <p>{c("updateBusy")}</p>}
        {refresh && (
          <button
            className="btn btn-quiet"
            disabled={busy}
            onClick={() => void updateServiceWorker(true)}
          >
            {c("update")}
          </button>
        )}
      </div>
      <button
        className="icon-button"
        aria-label={c("later")}
        onClick={() => {
          setReady(false);
          setRefresh(false);
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
export function InstallApp() {
  const c = useCopy();
  const event = useInstall((s) => s.event);
  const set = useInstall((s) => s.set);
  return (
    <div>
      <h2>{c("install")}</h2>
      <p>{c("installHelp")}</p>
      {event ? (
        <button
          className="btn btn-primary spaced"
          onClick={async () => {
            await event.prompt();
            await event.userChoice;
            set(null);
          }}
        >
          <Download size={20} />
          {c("install")}
        </button>
      ) : (
        <p className="muted spaced">{c("installManual")}</p>
      )}
    </div>
  );
}
