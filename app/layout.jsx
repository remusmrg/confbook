import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthWrapper from '@/components/AuthWrapper';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@/assets/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Confbook App | Rezervă o sală',
  description: 'Rezervă o sală de conferințe pentru tine sau echipa ta',
  icons:{
    icon:'/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <AuthWrapper>
      <html lang='ro-RO'>
        <head>
          <meta httpEquiv="content-language" content="ro-RO" />
          <meta name="locale" content="ro-RO" />
        </head>
        <body className={inter.className}>
          <Header />
          <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
            {children}
          </main>
          <Footer />
          <ToastContainer />
          
          {/* Script pentru configurarea locale-ului */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Configurează locale-ul pentru input-urile de dată și timp
                document.addEventListener('DOMContentLoaded', function() {
                  // Setează locale-ul pentru întreaga pagină
                  document.documentElement.lang = 'ro-RO';
                  
                  // Configurează toate input-urile existente
                  function configureInputs() {
                    const inputs = document.querySelectorAll('input[type="datetime-local"], input[type="time"]');
                    inputs.forEach(input => {
                      input.setAttribute('lang', 'ro-RO');
                      input.style.fontFamily = 'inherit';
                    });
                  }
                  
                  // Configurează input-urile existente
                  configureInputs();
                  
                  // Observă pentru input-uri noi
                  const observer = new MutationObserver(() => {
                    configureInputs();
                  });
                  
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });
                });
              `,
            }}
          />
        </body>
      </html>
    </AuthWrapper>
  );
}