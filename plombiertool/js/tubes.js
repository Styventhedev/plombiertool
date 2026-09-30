/* ===================== tubes.js =====================
   Catalogue indicatif des diamètres de tubes courants par matériau.
   ⚠️ Les valeurs varient selon les fabricants et les normes : elles sont
   indiquées ici à titre de repère général, pas comme référence officielle.
*/

const TUBES_DATA = {
  'Cuivre': {
    note: 'Diamètres extérieur / épaisseur courants en plomberie/chauffage (valeurs indicatives, norme NF EN 1057).',
    items: [
      { dim: '10 x 1 mm', info: 'Usage courant : alimentation eau, gaz' },
      { dim: '12 x 1 mm', info: 'Usage courant : alimentation eau' },
      { dim: '14 x 1 mm', info: 'Usage courant : alimentation eau, chauffage' },
      { dim: '16 x 1 mm', info: 'Usage courant : chauffage, alimentation' },
      { dim: '18 x 1 mm', info: 'Usage courant : chauffage' },
      { dim: '22 x 1 mm', info: 'Usage courant : chauffage, colonnes' },
      { dim: '28 x 1 mm', info: 'Usage courant : colonnes montantes' },
      { dim: '35 x 1 mm', info: 'Usage courant : gros diamètres, collecteurs' },
    ]
  },
  'PER': {
    note: 'Tube PER (polyéthylène réticulé), diamètres extérieurs courants. Les épaisseurs varient selon fabricant et classe de pression.',
    items: [
      { dim: '12 mm', info: 'Alimentation point par point' },
      { dim: '16 mm', info: 'Alimentation courante (le plus utilisé)' },
      { dim: '20 mm', info: 'Nourrice / alimentation générale' },
      { dim: '25 mm', info: 'Colonnes, alimentation générale' },
      { dim: '32 mm', info: 'Gros débit, alimentation principale' },
    ]
  },
  'Multicouche': {
    note: 'Tube multicouche (PER-Alu-PER), diamètres extérieurs indicatifs — épaisseur selon fabricant (Ø int. variable).',
    items: [
      { dim: '16 x 2 mm', info: 'Alimentation point par point' },
      { dim: '20 x 2 mm', info: 'Alimentation / chauffage' },
      { dim: '26 x 3 mm', info: 'Colonnes, nourrices' },
      { dim: '32 x 3 mm', info: 'Alimentation générale' },
      { dim: '40 x 4 mm', info: 'Gros diamètre, collecteurs' },
    ]
  },
  'PVC': {
    note: 'Tube PVC évacuation, diamètres extérieurs normalisés (NF EN 1329) — valeurs usuelles en France.',
    items: [
      { dim: 'Ø32 mm', info: 'Évacuation lavabo, petit appareil' },
      { dim: 'Ø40 mm', info: 'Évacuation évier, lavabo, machine à laver' },
      { dim: 'Ø50 mm', info: 'Évacuation douche, baignoire' },
      { dim: 'Ø100 mm', info: 'Évacuation WC, chute, collecteur' },
      { dim: 'Ø125 mm', info: 'Ventilation primaire / collecteur' },
    ]
  },
  'Acier': {
    note: 'Tube acier (diamètres nominaux DN), valeurs indicatives — dimensions réelles à vérifier selon norme (NF EN 10255) et fabricant.',
    items: [
      { dim: 'DN15 (1/2")', info: '≈ 21,3 mm extérieur' },
      { dim: 'DN20 (3/4")', info: '≈ 26,9 mm extérieur' },
      { dim: 'DN25 (1")', info: '≈ 33,7 mm extérieur' },
      { dim: 'DN32 (1"1/4)', info: '≈ 42,4 mm extérieur' },
      { dim: 'DN40 (1"1/2)', info: '≈ 48,3 mm extérieur' },
      { dim: 'DN50 (2")', info: '≈ 60,3 mm extérieur' },
    ]
  }
};

let currentTubeCategory = 'Cuivre';

function renderTubesTabs() {
  const tabsEl = document.getElementById('tubes-tabs');
  tabsEl.innerHTML = '';
  Object.keys(TUBES_DATA).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tube-tab' + (cat === currentTubeCategory ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      currentTubeCategory = cat;
      renderTubesTabs();
      renderTubesResults();
    });
    tabsEl.appendChild(btn);
  });
}

function renderTubesResults() {
  const resultsEl = document.getElementById('tubes-results');
  const search = document.getElementById('tubes-search').value.trim().toLowerCase();
  const cat = TUBES_DATA[currentTubeCategory];
  resultsEl.innerHTML = '';

  const noteDiv = document.createElement('div');
  noteDiv.className = 'tube-note';
  noteDiv.textContent = '⚠️ ' + cat.note;
  resultsEl.appendChild(noteDiv);

  const filtered = cat.items.filter(item =>
    !search || item.dim.toLowerCase().includes(search) || item.info.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Aucun résultat pour cette recherche dans cette catégorie.';
    resultsEl.appendChild(empty);
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'tube-card';
    card.innerHTML = `<div class="tube-dim">${item.dim}</div><div class="tube-info">${item.info}</div>`;
    resultsEl.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTubesTabs();
  renderTubesResults();
  document.getElementById('tubes-search').addEventListener('input', renderTubesResults);
});
