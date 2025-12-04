import type { Metadata } from 'next';
import { Chatbot } from '@/components/chatbot/Chatbot';
import './globals.css';

export const metadata: Metadata = {
  title: 'IFC Cambodge',
  description: 'Institut Français du Cambodge - Centre culturel et linguistique',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
