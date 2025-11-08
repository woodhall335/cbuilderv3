import './globals.css';

export const metadata = {
  title: 'Contract Heaven',
  description: 'Curated by Contract Heaven and completed by you.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
