import Gullu from '../widget';

export { metadata } from '../page';

export default function AppChat() {
  return (
    <main id="main" className="gullu-page gullu-in-app">
      <h1 className="sr-only">Chat with Gullu</h1>
      <Gullu embedded />
    </main>
  );
}
