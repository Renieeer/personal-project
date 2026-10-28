import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useSiteData } from '../lib/siteData.jsx';
import { SECTION_REGISTRY, getRenderableSections } from '../components/sections.js';
import { HomeSkeleton } from '../components/Skeleton.jsx';
import LoadError from '../components/LoadError.jsx';

export default function Home() {
  const { status, data } = useSiteData();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const firstRender = useRef(true);

  useEffect(() => {
    if (status === 'ready') document.title = data.settings?.site_title || data.profile?.full_name || '';
  }, [status, data]);

  // A fresh visit or a page refresh always starts at the top, even if the
  // address still ends in #section from an earlier menu click.
  useEffect(() => {
    if (status !== 'ready' || !firstRender.current) return;
    firstRender.current = false;
    if (navigationType === 'POP') {
      if (location.hash) navigate({ hash: '' }, { replace: true });
      window.scrollTo(0, 0);
    }
  }, [status, navigationType, location.hash, navigate]);

  // Menu links (here or from a project page) scroll to their section.
  useEffect(() => {
    if (status !== 'ready' || !location.hash || navigationType === 'POP') return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    target?.scrollIntoView();
  }, [status, location.hash, location.key, navigationType]);

  if (status === 'loading') return <HomeSkeleton />;
  if (status === 'error') return <LoadError />;

  let number = 0;
  return getRenderableSections(data).map((section) => {
    const { Component } = SECTION_REGISTRY[section.key];
    const index = section.key === 'hero' ? null : ++number;
    return <Component key={section.key} data={data} section={section} index={index} />;
  });
}
