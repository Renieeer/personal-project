import SingletonEditor from '../components/SingletonEditor.jsx';
import { settingsConfig } from '../resources.js';

export default function SettingsPage() {
  return <SingletonEditor config={settingsConfig} />;
}
