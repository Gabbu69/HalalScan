/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAppStore } from './store/useAppStore';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Scanner } from './pages/Scanner';
import { Analysis } from './pages/Analysis';
import { History } from './pages/History';
import { Knowledge } from './pages/Knowledge';
import { Profile } from './pages/Profile';
import { AiChat } from './pages/AiChat';

export default function App() {
  const { hasOnboarded } = useAppStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={!hasOnboarded ? <Onboarding /> : <Navigate to="/" />} />
        
        <Route element={hasOnboarded ? <Layout /> : <Navigate to="/onboarding" />}>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/chat" element={<AiChat />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/scanner" element={hasOnboarded ? <Scanner /> : <Navigate to="/onboarding" />} />
        <Route path="/analysis" element={hasOnboarded ? <Analysis /> : <Navigate to="/onboarding" />} />
      </Routes>
    </BrowserRouter>
  );
}
