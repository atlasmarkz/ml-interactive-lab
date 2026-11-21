import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ModulePage } from './pages/ModulePage';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ml-lab-theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('ml-lab-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('ml-lab-theme', 'light');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Layout isDark={isDark} onToggleDark={() => setIsDark((d) => !d)}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/part/:slug" element={<ModulePage isDark={isDark} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
