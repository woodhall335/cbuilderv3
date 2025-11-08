export default function Header() {
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="font-semibold">Contract Heaven</a>
        <nav className="flex gap-6 text-sm">
          <a href="/contracts">Contracts</a>
          <a href="/letters">Letters</a>
          <a href="/tools">Tools</a>
          <a href="/litigation">Litigation</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
      </div>
    </header>
  );
}
