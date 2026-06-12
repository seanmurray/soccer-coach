import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ATHLETE } from './config/athlete';
import App from './App.jsx';
import './index.css';

// Pick the right palette per athlete. The theme rules live in index.css under
// [data-theme="..."]; default (no attribute) is the Seamus navy/blue palette.
document.documentElement.dataset.theme = ATHLETE.theme;
document.title = ATHLETE.appName;
const meta = document.querySelector('meta[name="theme-color"]');
if (meta) meta.setAttribute('content', ATHLETE.themeColor);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
