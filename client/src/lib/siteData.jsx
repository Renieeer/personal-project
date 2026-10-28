import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';

const SiteDataContext = createContext({ status: 'loading', data: null });

// All public reads go straight to Supabase with the anon key; RLS only
// returns visible rows, so hidden items never reach the browser.
async function loadSiteData() {
  const queries = {
    profile: supabase.from('profile').select('*').maybeSingle(),
    settings: supabase.from('settings').select('*').maybeSingle(),
    ui: supabase.from('ui_text').select('texts').maybeSingle(),
    sections: supabase.from('section_visibility').select('*').order('sort_order'),
    socials: supabase.from('social_links').select('*').order('sort_order'),
    skills: supabase
      .from('skill_categories')
      .select('*, skills(*)')
      .order('sort_order')
      .order('sort_order', { referencedTable: 'skills' }),
    experience: supabase.from('experience').select('*').order('sort_order'),
    education: supabase.from('education').select('*').order('sort_order'),
    projects: supabase
      .from('projects')
      .select('id, slug, title, summary, tech_tags, live_url, repo_url, thumbnail_url')
      .order('sort_order'),
    certificates: supabase.from('certificates').select('*').order('sort_order'),
    testimonials: supabase.from('testimonials').select('*').order('sort_order'),
  };

  const entries = await Promise.all(
    Object.entries(queries).map(async ([key, query]) => {
      const { data, error } = await query;
      // Interface text is optional: without it (for example before the
      // ui_text table exists) the built-in defaults are used.
      if (key === 'ui') return [key, (!error && data?.texts) || {}];
      if (error) throw error;
      return [key, data ?? (key === 'profile' || key === 'settings' ? null : [])];
    }),
  );
  return Object.fromEntries(entries);
}

export function SiteDataProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let active = true;
    loadSiteData()
      .then((data) => active && setState({ status: 'ready', data }))
      .catch((error) => {
        console.error('Failed to load site content:', error);
        if (active) setState({ status: 'error', data: null });
      });
    return () => {
      active = false;
    };
  }, []);

  return <SiteDataContext.Provider value={state}>{children}</SiteDataContext.Provider>;
}

// Provides already-loaded data (the admin live editor uses it for its preview).
export function StaticSiteData({ data, children }) {
  const value = useMemo(() => ({ status: 'ready', data }), [data]);
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export const useSiteData = () => useContext(SiteDataContext);
