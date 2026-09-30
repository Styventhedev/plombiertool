/* ===================== fiches.js =====================
   Fiches chantier : client, adresse, date, description, travaux réalisés,
   matériel utilisé, notes, statut. Sauvegardées dans le localStorage.
*/

let currentFicheId = null;

const STATUT_LABELS = {
  todo: { emoji: '🟡', label: 'À faire', cls: 'status-todo' },
  wip: { emoji: '🔵', label: 'En cours', cls: 'status-wip' },
  done: { emoji: '🟢', label: 'Terminé', cls: 'status-done' }
};

function getFiches() {
  return DB.get('fiches', []);
}

function saveFiches(list) {
  DB.set('fiches', list);
}

function renderFichesListe() {
  const fiches = getFiches();
  const container = document.getElementById('fiches-liste');
  container.innerHTML = '';

  if (fiches.length === 0) {
    container.innerHTML = '<p class="muted">Aucune fiche chantier pour le moment.</p>';
    return;
  }

  fiches.slice().reverse().forEach((fiche, revIdx) => {
    const idx = fiches.length - 1 - revIdx;
    const statut = STATUT_LABELS[fiche.statut] || STATUT_LABELS.todo;
    const numero = String(idx + 1).padStart(3, '0');
    const card = document.createElement('div');
    card.className = 'fiche-card';
    card.innerHTML = `
      <div class="fiche-top">
        <div>
          <div class="fiche-client">Chantier #${numero} — ${escapeHtml(fiche.client) || 'Sans nom'}</div>
          <div class="fiche-sub">${escapeHtml(fiche.adresse) || ''}${fiche.date ? ' · ' + formatDateFR(fiche.date) : ''}</div>
        </div>
        <span class="status-pill ${statut.cls}">${statut.emoji} ${statut.label}</span>
      </div>`;
    card.addEventListener('click', () => openFiche(fiche.id));
    container.appendChild(card);
  });
}

function openFiche(id) {
  const fiches = getFiches();
  const fiche = id ? fiches.find(f => f.id === id) : null;
  currentFicheId = fiche ? fiche.id : null;

  document.getElementById('fiche-client').value = fiche?.client || '';
  document.getElementById('fiche-adresse').value = fiche?.adresse || '';
  document.getElementById('fiche-date').value = fiche?.date ? fiche.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  document.getElementById('fiche-description').value = fiche?.description || '';
  document.getElementById('fiche-travaux').value = fiche?.travaux || '';
  document.getElementById('fiche-materiel').value = fiche?.materiel || '';
  document.getElementById('fiche-notes').value = fiche?.notes || '';
  document.getElementById('fiche-statut').value = fiche?.statut || 'todo';

  document.getElementById('fiche-delete').hidden = !fiche;
  showScreen('screen-fiche-detail');
}

document.addEventListener('DOMContentLoaded', () => {
  renderFichesListe();

  document.getElementById('fiches-new').addEventListener('click', () => openFiche(null));

  document.getElementById('fiche-save').addEventListener('click', () => {
    const client = document.getElementById('fiche-client').value.trim();
    if (!client) {
      alert('Merci de renseigner au moins le nom du client.');
      return;
    }
    const fiches = getFiches();
    const data = {
      id: currentFicheId || uid(),
      client,
      adresse: document.getElementById('fiche-adresse').value,
      date: document.getElementById('fiche-date').value,
      description: document.getElementById('fiche-description').value,
      travaux: document.getElementById('fiche-travaux').value,
      materiel: document.getElementById('fiche-materiel').value,
      notes: document.getElementById('fiche-notes').value,
      statut: document.getElementById('fiche-statut').value
    };
    const idx = fiches.findIndex(f => f.id === data.id);
    if (idx >= 0) fiches[idx] = data; else fiches.push(data);
    saveFiches(fiches);
    renderFichesListe();
    goBack();
  });

  document.getElementById('fiche-delete').addEventListener('click', () => {
    if (!confirm('Supprimer définitivement cette fiche chantier ?')) return;
    const fiches = getFiches().filter(f => f.id !== currentFicheId);
    saveFiches(fiches);
    renderFichesListe();
    goBack();
  });
});
