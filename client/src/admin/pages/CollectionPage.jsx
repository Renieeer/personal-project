import CollectionEditor from '../components/CollectionEditor.jsx';
import { resources } from '../resources.js';

export default function CollectionPage({ resource }) {
  return <CollectionEditor config={resources[resource]} heading="h1" />;
}
