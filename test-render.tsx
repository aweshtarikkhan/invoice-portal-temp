import { renderToString } from 'react-dom/server';
import React from 'react';
import MarketingPostersPage from './src/pages/MarketingPostersPage';

try {
  const html = renderToString(<MarketingPostersPage />);
  console.log("Render successful. Length:", html.length);
} catch (e) {
  console.error("Render failed:");
  console.error(e);
}
