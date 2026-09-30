/* ===================== app.js =====================
   Cœur de l'application : navigation entre écrans, écran de chargement,
   gestion hors-ligne, enregistrement du service worker (PWA).
*/

const APP_VERSION = '1.0.0';
let screenHistory = ['screen-dashboard'];
let deferredInstallPrompt = null;

function isInstalledApp() {
  return window.plombiertoolPlatform?.native === true ||
    window.Capacitor?.isNativePlatform?.() === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true;
}

function isAppleMobileDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function updateInstallButton() {
  const button = document.getElementById('installAppButton');
  if (button) button.hidden = false;
}

function getLatestReleaseBase() {
  const suffix = '.github.io';
  if (!location.hostname.endsWith(suffix)) return null;
  const owner = location.hostname.slice(0, -suffix.length);
  const repository = location.pathname.split('/').filter(Boolean)[0] || `${owner}.github.io`;
  return `https://github.com/${owner}/${repository}/releases/latest/download`;
}

function updateAppDownloadDialog() {
  const message = document.getElementById('app-download-message');
  const androidLink = document.getElementById('downloadAndroidApp');
  const windowsLink = document.getElementById('downloadWindowsApp');
  const installButton = document.getElementById('installPwaButton');
  const hint = document.getElementById('pwa-install-hint');
  if (!message || !androidLink || !windowsLink || !installButton || !hint) return;

  const releaseBase = getLatestReleaseBase();
  androidLink.hidden = !releaseBase;
  windowsLink.hidden = !releaseBase;
  if (releaseBase) {
    androidLink.href = `${releaseBase}/PlombierTool-Android.apk`;
    windowsLink.href = `${releaseBase}/PlombierTool-Setup.exe`;
    message.textContent = 'Choisissez le fichier adapté à votre appareil.';
  } else {
    message.textContent = 'Les fichiers APK et EXE seront proposés ici après la publication d’une version sur GitHub Releases.';
  }

  const installed = isInstalledApp();
  installButton.hidden = !deferredInstallPrompt || installed;
  hint.textContent = deferredInstallPrompt || installed
    ? ''
    : isAppleMobileDevice()
      ? 'Sur iPhone ou iPad : touchez Partager, puis « Sur l’écran d’accueil ».'
      : 'Pour l’installation PWA, ouvrez le menu du navigateur et choisissez « Installer l’application ». Le site doit être servi en HTTPS.';
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButton();
  updateAppDownloadDialog();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  updateInstallButton();
  updateAppDownloadDialog();
});

function showScreen(id, opts = {}) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  if (!opts.silent) {
    if (opts.reset) screenHistory = [id];
    else screenHistory.push(id);
  }

  // Titre de l'en-tête
  const titles = {
    'screen-dashboard': 'PlombierTool',
    'screen-hydraulique': 'Calculs hydrauliques',
    'screen-chauffage': 'Chauffage',
    'screen-mesures': 'Mesures & conversions',
    'screen-tubes': 'Tubes & raccords',
    'screen-devis': 'Devis',
    'screen-interventions': 'Interventions',
    'screen-intervention-detail': 'Nouvelle intervention',
    'screen-checklist': 'Checklist chantier',
    'screen-fiches': 'Fiches chantier',
    'screen-fiche-detail': 'Fiche chantier',
    'screen-parametres': 'Paramètres'
  };
  document.getElementById('pageTitle').textContent = titles[id] || 'PlombierTool';

  // Bouton retour
  const btnBack = document.getElementById('btnBack');
  btnBack.hidden = (id === 'screen-dashboard');

  // Nav du bas + menu latéral : surligner l'onglet actif si présent
  const navScreenId = id === 'screen-intervention-detail' ? 'screen-interventions' : id;
  document.querySelectorAll('.nav-btn, .sidebar-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === navScreenId);
  });

  window.scrollTo(0, 0);
}

function goBack() {
  if (screenHistory.length > 1) {
    screenHistory.pop();
    const prev = screenHistory[screenHistory.length - 1];
    showScreen(prev, { silent: true });
  } else {
    showScreen('screen-dashboard', { reset: true });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Splash screen
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
  }, 600);

  // Version affichée dans les paramètres
  const v = document.getElementById('app-version');
  if (v) v.textContent = APP_VERSION;

  // Cartes du dashboard
  document.querySelectorAll('.card-nav').forEach(card => {
    card.addEventListener('click', () => showScreen(card.dataset.screen));
  });

  // Navigation basse (mobile)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen, { reset: true }));
  });

  // Menu latéral (PC)
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen, { reset: true }));
  });

  // Bouton retour du header
  document.getElementById('btnBack').addEventListener('click', goBack);

  const installButton = document.getElementById('installAppButton');
  if (installButton) {
    installButton.addEventListener('click', () => {
      updateAppDownloadDialog();
      document.getElementById('appDownloadDialog').showModal();
    });
    updateInstallButton();
    updateAppDownloadDialog();
  }

  const installPwaButton = document.getElementById('installPwaButton');
  if (installPwaButton) {
    installPwaButton.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      const installPrompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') updateAppDownloadDialog();
      } catch (error) {
        console.warn('Installation de PlombierTool indisponible :', error);
      }
    });
  }

  document.getElementById('closeAppDownloadDialog').addEventListener('click', () => {
    document.getElementById('appDownloadDialog').close();
  });

  // Badge hors-ligne
  updateOfflineBadge();
  window.addEventListener('online', updateOfflineBadge);
  window.addEventListener('offline', updateOfflineBadge);
});

function updateOfflineBadge() {
  const badge = document.getElementById('offlineBadge');
  badge.hidden = navigator.onLine;
}

/* ===================== Helper générique pour les écrans "calculateurs" =====================
   Chaque module (hydraulique.js, chauffage.js, mesures.js) fournit une liste d'outils :
   { id, name, sub, render(container) }
   render(container) doit remplir le container avec les champs de saisie + le résultat live.
*/
function initToolScreen(listElId, detailElId, tools) {
  const listEl = document.getElementById(listElId);
  const detailEl = document.getElementById(detailElId);

  tools.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.innerHTML = `
      <div>
        <div class="tool-name">${tool.name}</div>
        <div class="tool-sub">${tool.sub || ''}</div>
      </div>
      <span class="chevron">›</span>`;
    card.addEventListener('click', () => {
      listEl.hidden = true;
      detailEl.hidden = false;
      detailEl.innerHTML = '';
      const backBtn = document.createElement('button');
      backBtn.className = 'btn-ghost';
      backBtn.textContent = '← Retour à la liste';
      backBtn.style.marginBottom = '12px';
      backBtn.addEventListener('click', () => {
        detailEl.hidden = true;
        listEl.hidden = false;
      });
      detailEl.appendChild(backBtn);
      const box = document.createElement('div');
      detailEl.appendChild(box);
      tool.render(box);
    });
    listEl.appendChild(card);
  });
}

// Petit helper pour construire le HTML d'un calculateur standard
function toolTemplate({ title, explanation, formula, inputsHTML, warning }) {
  return `
    <h2>${title}</h2>
    <p class="muted">${explanation}</p>
    <div class="formula-box">📐 Formule : ${formula}</div>
    ${inputsHTML}
    ${warning ? `<div class="warning-box">⚠️ ${warning}</div>` : ''}
    <div class="result-box" id="tool-result">Renseignez les valeurs ci-dessus</div>
  `;
}

// Enregistrement du service worker (fonctionnement hors ligne)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const appBase = new URL('./', document.baseURI);
    const workerUrl = new URL('service-worker.js', appBase);
    navigator.serviceWorker.register(workerUrl.href, { scope: appBase.pathname }).catch(err => {
      console.warn('Service worker non installé :', err);
    });
  });
}
