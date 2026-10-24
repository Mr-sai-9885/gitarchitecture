import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page">
      <h1>Repository Architecture Visualizer</h1>
      <p>
        View a visual file-tree diagram for a public GitHub repository by visiting
        {' '}<code>/&lt;owner&gt;/&lt;repo&gt;</code>.
      </p>
      <p>
        For example, explore{' '}
        <Link href="/vercel/next.js">vercel/next.js</Link>.
      </p>
    </main>
  );
}
