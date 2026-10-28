import SingletonEditor from '../components/SingletonEditor.jsx';
import CollectionEditor from '../components/CollectionEditor.jsx';
import { profileConfig, resources } from '../resources.js';

export default function ProfilePage() {
  return (
    <>
      <SingletonEditor config={profileConfig} />
      <CollectionEditor config={resources.social_links} />
    </>
  );
}
