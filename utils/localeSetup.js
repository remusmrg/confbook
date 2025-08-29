// utils/localeSetup.js
// Acest fișier configurează locale-ul pentru întreaga aplicație

/**
 * Configurează locale-ul pentru format european în toată aplicația
 */
export function setupEuropeanLocale() {
  // Setează locale-ul implicit pentru JavaScript
  if (typeof window !== 'undefined') {
    // Setează meta tag-ul pentru locale
    let metaLocale = document.querySelector('meta[http-equiv="content-language"]');
    if (!metaLocale) {
      metaLocale = document.createElement('meta');
      metaLocale.setAttribute('http-equiv', 'content-language');
      document.head.appendChild(metaLocale);
    }
    metaLocale.setAttribute('content', 'ro-RO');
    
    // Setează atributul lang pe html
    document.documentElement.lang = 'ro-RO';
    
    // Configurează toate input-urile datetime-local și time existente
    configureInputs();
    
    // Observă pentru input-uri noi adăugate dinamic
    observeNewInputs();
  }
}

/**
 * Configurează input-urile datetime-local și time pentru format european
 */
function configureInputs() {
  const dateTimeInputs = document.querySelectorAll('input[type="datetime-local"]');
  const timeInputs = document.querySelectorAll('input[type="time"]');
  
  [...dateTimeInputs, ...timeInputs].forEach(input => {
    // Setează atribute pentru format european
    input.setAttribute('lang', 'ro-RO');
    input.setAttribute('data-format', 'european');
    
    // Adaugă un event listener pentru validare
    input.addEventListener('input', function(e) {
      // Validează că formatul este corect
      validateEuropeanFormat(e.target);
    });
  });
}

/**
 * Observă pentru input-uri noi și le configurează automat
 */
function observeNewInputs() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Verifică dacă nodul adăugat este un input
          if (node.matches && (node.matches('input[type="datetime-local"]') || node.matches('input[type="time"]'))) {
            configureInput(node);
          }
          // Verifică și copiii nodului
          const inputs = node.querySelectorAll && node.querySelectorAll('input[type="datetime-local"], input[type="time"]');
          if (inputs) {
            inputs.forEach(configureInput);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Configurează un input individual
 */
function configureInput(input) {
  input.setAttribute('lang', 'ro-RO');
  input.setAttribute('data-format', 'european');
  
  input.addEventListener('input', function(e) {
    validateEuropeanFormat(e.target);
  });
}

/**
 * Validează formatul european al input-ului
 */
function validateEuropeanFormat(input) {
  // Adaugă validări suplimentare dacă este necesar
  // Pentru moment, browserul ar trebui să respecte atributul lang
  
  // Poți adăuga aici logică pentru a afișa mesaje de ajutor
  if (input.value) {
    // Input-ul are o valoare, totul pare în regulă
    input.style.borderColor = '';
  }
}

/**
 * Hook pentru React components
 */
export function useEuropeanLocale() {
  if (typeof window !== 'undefined') {
    React.useEffect(() => {
      setupEuropeanLocale();
    }, []);
  }
}