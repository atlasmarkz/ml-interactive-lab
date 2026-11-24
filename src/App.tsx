import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ModulePage } from './pages/ModulePage';
import { ReviewHubPage } from './pages/review/ReviewHubPage';
import { FlashcardsPage } from './pages/review/FlashcardsPage';
import { QuizPage } from './pages/review/QuizPage';
import { FormulasPage } from './pages/review/FormulasPage';
import { AssignmentsPage } from './pages/review/AssignmentsPage';

const Narrow: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="mx-auto max-w-4xl">{children}</div>;

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
          <Route path="/" element={<Narrow><HomePage /></Narrow>} />
          <Route path="/lecture/:slug" element={<ModulePage isDark={isDark} />} />
          <Route path="/review" element={<Narrow><ReviewHubPage /></Narrow>} />
          <Route path="/review/flashcards" element={<Narrow><FlashcardsPage /></Narrow>} />
          <Route path="/review/quiz" element={<Narrow><QuizPage /></Narrow>} />
          <Route path="/review/formulas" element={<Narrow><FormulasPage /></Narrow>} />
          <Route path="/review/assignments" element={<Narrow><AssignmentsPage /></Narrow>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
