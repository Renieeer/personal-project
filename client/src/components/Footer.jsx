import { useSiteData } from '../lib/siteData.jsx';
import { EditText } from '../lib/edit.jsx';
import SocialLinks from './SocialLinks.jsx';

export default function Footer() {
  const { data } = useSiteData();
  const owner = data.settings?.copyright_text || data.profile?.full_name;

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          &copy; {new Date().getFullYear()}
          {owner ? ' ' : ''}
          <EditText at="settings.copyright_text" placeholder={data.profile?.full_name}>{owner}</EditText>
        </p>
        <SocialLinks links={data.socials} />
      </div>
    </footer>
  );
}
