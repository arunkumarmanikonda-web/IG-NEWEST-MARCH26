import Gullu from './widget';

export const metadata = {
  title: 'Chat with Gullu',
  description: 'Your India Gully buddy for properties, HORECA and our practices.',
  robots: { index: false, follow: true },
};
export default function GulluPage() {
  return <main id="main" className="gullu-page"><h1 className="sr-only">Chat with Gullu</h1><Gullu embedded /></main>;
}
