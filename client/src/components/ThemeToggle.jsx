import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTheme, setTheme } from '../lib/theme.js';
import { useText } from '../lib/uiText.js';

const ENTRY_TAPS = 5;
const ENTRY_GAP_MS = 1000;

// With `entryPath`, tapping the toggle ENTRY_TAPS times in a row (each tap
// within ENTRY_GAP_MS of the previous one) opens that path. Every tap still
// switches the theme, and the theme from before the first tap is restored
// when the path opens.
export default function ThemeToggle({ className = 'theme-toggle plain-button', entryPath }) {
  const [theme, setThemeState] = useState(getTheme);
  const taps = useRef({ count: 0, last: 0, startTheme: null });
  const navigate = useNavigate();
  const text = useText();

  const apply = (next) => {
    setTheme(next);
    setThemeState(next);
  };

  const toggle = () => {
    if (entryPath) {
      const now = Date.now();
      const sequence = taps.current;
      if (now - sequence.last > ENTRY_GAP_MS) {
        sequence.count = 0;
        sequence.startTheme = theme;
      }
      sequence.count += 1;
      sequence.last = now;
      if (sequence.count >= ENTRY_TAPS) {
        sequence.count = 0;
        sequence.last = 0;
        apply(sequence.startTheme);
        navigate(entryPath);
        return;
      }
    }
    apply(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button type="button" className={className} onClick={toggle} aria-pressed={theme === 'dark'}>
      {theme === 'dark' ? text('theme_light') : text('theme_dark')}
    </button>
  );
}
