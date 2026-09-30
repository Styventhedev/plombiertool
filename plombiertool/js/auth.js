/* ===================== auth.js =====================
   Comptes utilisateurs + synchronisation en ligne (Firebase).

   Objectif : si l'utilisateur crée un compte (e-mail + mot de passe),
   ses devis / checklists / fiches chantier sont aussi sauvegardés dans
   Firestore, en plus du localStorage. Ainsi, en changeant de téléphone
   ou en réinstallant l'appli, il retrouve ses données en se reconnectant.

   Sans compte, l'application continue de fonctionner exactement comme
   avant (100% locale, sur cet appareil uniquement).
*/

let fbAuth = null;
let fbDb = null;
let currentUser = null;
let firebaseReady = false;

function isFirebaseConfigured() {
  return typeof firebaseConfig !== 'undefined' &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'COLLE_TA_CLE_API_ICI';
}

function setAccountMessage(msg, isError = false) {
  const el = document.getElementById('account-message');
  if (!el) return;
  el.textContent = msg || '';
  el.style.color = isError ? 'var(--red)' : 'var(--text-muted)';
}

function updateAccountUI() {
  const accountSection = document.getElementById('account-section');
  const loggedOutBox = document.getElementById('account-logged-out');
  const loggedInBox = document.getElementById('account-logged-in');

  if (!firebaseReady) {
    if (accountSection) accountSection.hidden = true;
    return;
  }
  if (accountSection) accountSection.hidden = false;

  if (currentUser) {
    loggedOutBox.hidden = true;
    loggedInBox.hidden = false;
    document.getElementById('account-email-display').textContent = currentUser.email;
  } else {
    loggedOutBox.hidden = false;
    loggedInBox.hidden = true;
  }
}

// Envoie une clé de données vers Firestore (appelé automatiquement par db.js)
window.__onLocalDataChanged = function (key, value) {
  if (!firebaseReady || !currentUser) return;
  fbDb.collection('plombiertool_users').doc(currentUser.uid)
    .set({ [key]: value, updated_at: new Date().toISOString() }, { merge: true })
    .catch((e) => console.warn('Synchro cloud impossible pour', key, e));
};

// Pousse toutes les données locales actuelles vers le cloud (première sauvegarde)
function pushAllLocalDataToCloud() {
  if (!currentUser) return;
  const payload = { updated_at: new Date().toISOString() };
  CLOUD_SYNCED_KEYS.forEach((key) => {
    payload[key] = DB.get(key, null);
  });
  return fbDb.collection('plombiertool_users').doc(currentUser.uid)
    .set(payload, { merge: true });
}

// Récupère les données du cloud et les installe en local, puis recharge l'appli
function pullCloudDataToLocal() {
  if (!currentUser) return;
  fbDb.collection('plombiertool_users').doc(currentUser.uid).get()
    .then((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        let hasCloudData = false;
        CLOUD_SYNCED_KEYS.forEach((key) => {
          if (data[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            hasCloudData = true;
          }
        });
        if (hasCloudData) {
          setAccountMessage('Données synchronisées depuis votre compte.');
          setTimeout(() => location.reload(), 600);
          return;
        }
      }
      // Pas encore de données dans le cloud : on y met les données locales actuelles
      pushAllLocalDataToCloud().then(() => {
        setAccountMessage('Sauvegarde en ligne activée pour ce compte.');
      });
    })
    .catch((e) => {
      console.warn('Lecture cloud impossible', e);
      setAccountMessage('Connecté, mais synchro impossible pour le moment (hors ligne ?).', true);
    });
}

function doSignup() {
  const email = document.getElementById('account-email').value.trim();
  const password = document.getElementById('account-password').value;
  if (!email || !password) { setAccountMessage('Renseigne un e-mail et un mot de passe.', true); return; }
  if (password.length < 6) { setAccountMessage('Le mot de passe doit faire au moins 6 caractères.', true); return; }
  setAccountMessage('Création du compte...');
  fbAuth.createUserWithEmailAndPassword(email, password)
    .catch((e) => setAccountMessage(traduireErreurFirebase(e), true));
}

function doLogin() {
  const email = document.getElementById('account-email').value.trim();
  const password = document.getElementById('account-password').value;
  if (!email || !password) { setAccountMessage('Renseigne ton e-mail et ton mot de passe.', true); return; }
  setAccountMessage('Connexion...');
  fbAuth.signInWithEmailAndPassword(email, password)
    .catch((e) => setAccountMessage(traduireErreurFirebase(e), true));
}

function doLogout() {
  fbAuth.signOut();
}

function traduireErreurFirebase(e) {
  const map = {
    'auth/email-already-in-use': 'Cet e-mail a déjà un compte — connecte-toi plutôt.',
    'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
    'auth/user-not-found': 'Aucun compte avec cet e-mail.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
    'auth/network-request-failed': 'Pas de connexion internet.'
  };
  return map[e.code] || ('Erreur : ' + e.message);
}

document.addEventListener('DOMContentLoaded', async () => {
  const librariesReady = await window.firebaseLibrariesReady;
  if (!librariesReady || typeof firebase === 'undefined' || !isFirebaseConfigured()) {
    firebaseReady = false;
    updateAccountUI();
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();
    firebaseReady = true;
  } catch (e) {
    console.error('Initialisation Firebase impossible', e);
    firebaseReady = false;
    updateAccountUI();
    return;
  }

  fbAuth.onAuthStateChanged((user) => {
    currentUser = user;
    updateAccountUI();
    if (user) pullCloudDataToLocal();
  });

  document.getElementById('account-signup').addEventListener('click', doSignup);
  document.getElementById('account-login').addEventListener('click', doLogin);
  document.getElementById('account-logout').addEventListener('click', doLogout);
});
