/* ===================== db.js =====================
   Petites fonctions utilitaires pour lire/écrire dans le localStorage.
   Toutes les données de l'application (devis, checklists, fiches, réglages)
   passent par ici. Par défaut tout reste sur l'appareil (localStorage).

   Si l'utilisateur crée un compte (voir auth.js), les clés listées dans
   CLOUD_SYNCED_KEYS sont aussi sauvegardées en ligne (Firestore), pour ne
   pas perdre les données en cas de changement d'appareil ou de réinstallation.
   auth.js s'accroche à DB.set() via window.__onLocalDataChanged.
*/

const CLOUD_SYNCED_KEYS = ['devis_list', 'checklists', 'fiches'];

const DB = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Erreur lecture localStorage', key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Si un compte est connecté (auth.js), on pousse aussi la donnée en ligne.
      if (CLOUD_SYNCED_KEYS.includes(key) && typeof window.__onLocalDataChanged === 'function') {
        window.__onLocalDataChanged(key, value);
      }
      return true;
    } catch (e) {
      console.error('Erreur écriture localStorage', key, e);
      return false;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

// Petit générateur d'identifiant unique (suffisant pour un usage local)
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatEuro(n) {
  return (isFinite(n) ? n : 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function formatDateFR(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR');
}
