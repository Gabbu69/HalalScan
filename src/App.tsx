import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAppStore } from "./store/useAppStore";
import { Home } from "./pages/Home";
import { useCopy } from "./utils/copy";
const Scanner = lazy(() =>
  import("./pages/Scanner").then((m) => ({ default: m.Scanner })),
);
const Analysis = lazy(() =>
  import("./pages/Analysis").then((m) => ({ default: m.Analysis })),
);
const SavedAnalysis = lazy(() =>
  import("./pages/SavedAnalysis").then((m) => ({ default: m.SavedAnalysis })),
);
const History = lazy(() =>
  import("./pages/History").then((m) => ({ default: m.History })),
);
const Knowledge = lazy(() =>
  import("./pages/Knowledge").then((m) => ({ default: m.Knowledge })),
);
const Profile = lazy(() =>
  import("./pages/Profile").then((m) => ({ default: m.Profile })),
);
const AiChat = lazy(() =>
  import("./pages/AiChat").then((m) => ({ default: m.AiChat })),
);
const Evaluation = lazy(() =>
  import("./pages/Evaluation").then((m) => ({ default: m.Evaluation })),
);
const Onboarding = lazy(() =>
  import("./pages/Onboarding").then((m) => ({ default: m.Onboarding })),
);
function ScrollReset() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}
function Research() {
  const c = useCopy();
  return (
    <>
      <div className="notice global-notice">{c("historicalResearch")}</div>
      <Evaluation />
    </>
  );
}
function Missing() {
  const c = useCopy();
  return (
    <div className="page">
      <h1>{c("expired")}</h1>
      <Link to="/" className="btn btn-primary spaced">
        {c("home")}
      </Link>
    </div>
  );
}
export default function App() {
  const language = useAppStore((s) => s.language);
  const dark = useAppStore((s) => s.isDarkMode);
  const initialize = useAppStore((s) => s.initialize);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    document.documentElement.dir = language === "Arabic" ? "rtl" : "ltr";
    document.documentElement.lang =
      language === "Arabic" ? "ar" : language === "Tagalog" ? "fil" : "en";
    document.documentElement.classList.toggle("dark", dark);
  }, [language, dark]);
  return (
    <BrowserRouter>
      <ScrollReset />
      <Suspense
        fallback={
          <div className="page" role="status">
            HalalScan…
          </div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="history" element={<History />} />
            <Route path="history/:id" element={<SavedAnalysis />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="chat" element={<AiChat />} />
            <Route path="profile" element={<Profile />} />
            <Route path="evaluation" element={<Research />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="*" element={<Missing />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
