import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrowEasy CSV Importer — AI-Powered CRM Lead Extraction',
  description:
    'Upload any CSV file and let AI intelligently extract and map your leads into GrowEasy CRM format. Supports Facebook, Google Ads, Excel, and any custom CSV format.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
