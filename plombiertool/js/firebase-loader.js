window.firebaseLibrariesReady = (async () => {
  const config = window.firebaseConfig;
  if (!config?.apiKey || config.apiKey === 'COLLE_TA_CLE_API_ICI') return false;

  const sources = [
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'
  ];

  for (const source of sources) {
    const loaded = await new Promise(resolve => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        script.remove();
        resolve(false);
      }, 8000);
      script.src = source;
      script.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        resolve(false);
      };
      document.head.appendChild(script);
    });
    if (!loaded) return false;
  }

  return typeof firebase !== 'undefined';
})();
