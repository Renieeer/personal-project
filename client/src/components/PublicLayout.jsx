import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSiteData } from '../lib/siteData.jsx';
import { readableTextOn } from '../lib/format.js';
import { useText } from '../lib/uiText.js';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content || '');
}

function setFavicon(href) {
  let link = document.querySelector('link[rel="icon"]');
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function PublicLayout() {
  const { status, data } = useSiteData();
  const settings = data?.settings;
  const text = useText();

  useEffect(() => {
    if (!settings) return;
    setMeta('description', settings.meta_description);
    setFavicon(settings.favicon_url);
    const root = document.documentElement;
    if (settings.accent_color) {
      root.style.setProperty('--accent', settings.accent_color);
      root.style.setProperty('--on-accent', readableTextOn(settings.accent_color));
    }
  }, [settings]);

  return (
    <div className="site">
      <a href="#main" className="skip-link">{text('skip_link')}</a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      {status === 'ready' && <Footer />}
    </div>
  );
}
