export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-neutral-500">
        <div className="flex flex-wrap gap-6">
          <a href="/about">About</a>
          <a href="/pricing">Pricing</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/sitemap.xml">Sitemap</a>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Contract Heaven.</p>
      </div>
    </footer>
  );
}
