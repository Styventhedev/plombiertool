/* ===================== devis.js =====================
   Générateur de devis simple : infos client, lignes de matériel/main d'œuvre,
   calcul HT/TVA/TTC, sauvegarde locale, impression.
*/

let currentDevisId = null;

function newDevisLine(data = { desc: '', qte: 1, pu: 0 }) {
  const linesEl = document.getElementById('devis-lines');
  const row = document.createElement('div');
  row.className = 'devis-line';
  row.innerHTML = `
    <input type="text" class="input-field line-desc" placeholder="Description (ex : Robinet, main d'œuvre...)" value="${escapeHtml(data.desc)}">
    <input type="number" class="input-field line-qte" placeholder="Qté" value="${data.qte}" min="0" step="0.5">
    <input type="number" class="input-field line-pu" placeholder="PU €" value="${data.pu}" min="0" step="0.01">
    <button class="line-remove" title="Supprimer">✕</button>`;
  row.querySelector('.line-remove').addEventListener('click', () => {
    row.remove();
    updateDevisTotaux();
  });
  row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateDevisTotaux));
  linesEl.appendChild(row);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function updateDevisTotaux() {
  const rows = document.querySelectorAll('#devis-lines .devis-line');
  let totalHT = 0;
  rows.forEach(row => {
    const qte = parseFloat(row.querySelector('.line-qte').value) || 0;
    const pu = parseFloat(row.querySelector('.line-pu').value) || 0;
    totalHT += qte * pu;
  });
  const tva = parseFloat(document.getElementById('devis-tva').value) || 0;
  const montantTVA = totalHT * (tva / 100);
  const totalTTC = totalHT + montantTVA;

  document.getElementById('devis-total-ht').textContent = formatEuro(totalHT);
  document.getElementById('devis-total-tva').textContent = formatEuro(montantTVA);
  document.getElementById('devis-total-ttc').textContent = formatEuro(totalTTC);
}

function collectDevisData() {
  const lines = [];
  document.querySelectorAll('#devis-lines .devis-line').forEach(row => {
    lines.push({
      desc: row.querySelector('.line-desc').value,
      qte: parseFloat(row.querySelector('.line-qte').value) || 0,
      pu: parseFloat(row.querySelector('.line-pu').value) || 0
    });
  });
  return {
    id: currentDevisId || uid(),
    client: document.getElementById('devis-client').value,
    adresse: document.getElementById('devis-adresse').value,
    description: document.getElementById('devis-description').value,
    tva: parseFloat(document.getElementById('devis-tva').value) || 0,
    lines,
    date: new Date().toISOString()
  };
}

function loadDevisIntoForm(devis) {
  currentDevisId = devis.id;
  document.getElementById('devis-client').value = devis.client || '';
  document.getElementById('devis-adresse').value = devis.adresse || '';
  document.getElementById('devis-description').value = devis.description || '';
  document.getElementById('devis-tva').value = devis.tva ?? 10;
  document.getElementById('devis-lines').innerHTML = '';
  (devis.lines || []).forEach(l => newDevisLine(l));
  if (!devis.lines || devis.lines.length === 0) newDevisLine();
  updateDevisTotaux();
}

function resetDevisForm() {
  currentDevisId = null;
  document.getElementById('devis-client').value = '';
  document.getElementById('devis-adresse').value = '';
  document.getElementById('devis-description').value = '';
  document.getElementById('devis-tva').value = 10;
  document.getElementById('devis-lines').innerHTML = '';
  newDevisLine();
  updateDevisTotaux();
}

function renderSavedDevis() {
  const list = DB.get('devis_list', []);
  const container = document.getElementById('devis-saved-list');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p class="muted">Aucun devis enregistré pour le moment.</p>';
    return;
  }
  list.slice().reverse().forEach(devis => {
    const totalHT = (devis.lines || []).reduce((s, l) => s + l.qte * l.pu, 0);
    const totalTTC = totalHT * (1 + (devis.tva || 0) / 100);
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.innerHTML = `
      <div>
        <div class="tool-name">${escapeHtml(devis.client) || 'Client sans nom'}</div>
        <div class="tool-sub">${formatDateFR(devis.date)} — ${formatEuro(totalTTC)} TTC</div>
      </div>
      <span class="chevron">›</span>`;
    card.addEventListener('click', () => loadDevisIntoForm(devis));
    container.appendChild(card);
  });
}

function saveCurrentDevis() {
  const devis = collectDevisData();
  if (!devis.client) {
    alert('Merci de renseigner au moins le nom du client avant d\'enregistrer.');
    return;
  }
  const list = DB.get('devis_list', []);
  const idx = list.findIndex(d => d.id === devis.id);
  if (idx >= 0) list[idx] = devis; else list.push(devis);
  DB.set('devis_list', list);
  currentDevisId = devis.id;
  renderSavedDevis();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('devis-add-line').addEventListener('click', () => newDevisLine());
  document.getElementById('devis-tva').addEventListener('input', updateDevisTotaux);
  document.getElementById('devis-save').addEventListener('click', saveCurrentDevis);
  document.getElementById('devis-new').addEventListener('click', resetDevisForm);
  document.getElementById('devis-print').addEventListener('click', () => {
    saveCurrentDevis();
    window.print();
  });
  resetDevisForm();
  renderSavedDevis();
});
