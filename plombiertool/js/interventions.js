/* ===================== INTERVENTIONS ===================== */
const INTERVENTION_STATUS = {
  todo: { label: 'À faire', className: 'status-todo' },
  wip: { label: 'En cours', className: 'status-wip' },
  done: { label: 'Terminé', className: 'status-done' }
};

let currentInterventionId = null;
let interventionSaveTimer = null;
let signatureDrawing = false;

function getInterventions() {
  return DB.get('interventions', []);
}

function getInterventionClients() {
  return DB.get('clients', []);
}

function localDateTimeValue() {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 16);
}

function interventionEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function renderInterventionClients(selectedId = '') {
  const select = document.getElementById('intervention-client');
  const clients = getInterventionClients().slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  select.innerHTML = '<option value="">Choisir un client…</option>';
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    select.appendChild(option);
  });
  select.value = selectedId;
}

function renderInterventionsList() {
  const filter = document.getElementById('intervention-history-client');
  const selectedFilter = filter.value;
  const clients = getInterventionClients();
  filter.innerHTML = '<option value="">Tous les clients</option>';
  clients.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    filter.appendChild(option);
  });
  filter.value = clients.some(client => client.id === selectedFilter) ? selectedFilter : '';

  const container = document.getElementById('interventions-list');
  container.innerHTML = '';
  const entries = getInterventions().filter(item => !filter.value || item.clientId === filter.value)
    .slice().sort((a, b) => (b.dateTime || '').localeCompare(a.dateTime || ''));

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'muted intervention-empty';
    empty.textContent = filter.value ? 'Aucune intervention pour ce client.' : 'Aucune intervention enregistrée.';
    container.appendChild(empty);
    return;
  }

  entries.forEach(item => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'intervention-card';
    const status = INTERVENTION_STATUS[item.status] || INTERVENTION_STATUS.todo;
    const when = item.dateTime ? new Date(item.dateTime).toLocaleString('fr-FR', {
      dateStyle: 'medium', timeStyle: 'short'
    }) : 'Date non renseignée';
    card.innerHTML = `
      <span class="intervention-card-main">
        <strong>${interventionEscape(item.clientName || 'Client à renseigner')}</strong>
        <span>${interventionEscape(when)} · ${interventionEscape(item.type || 'Autre')}</span>
      </span>
      <span class="status-pill ${status.className}">${status.label}</span>`;
    card.addEventListener('click', () => openIntervention(item.id));
    container.appendChild(card);
  });
}

function addInterventionMaterialRow(material = {}) {
  const row = document.createElement('div');
  row.className = 'intervention-material-row';
  row.innerHTML = `
    <input class="input-field material-name" type="text" aria-label="Matériel" placeholder="Matériel utilisé">
    <input class="input-field material-quantity" type="number" aria-label="Quantité" min="0" step="0.1" inputmode="decimal" placeholder="Qté">
    <input class="input-field material-price" type="number" aria-label="Prix unitaire en euros" min="0" step="0.01" inputmode="decimal" placeholder="Prix €">
    <button type="button" class="material-remove" aria-label="Supprimer cette ligne" title="Supprimer">×</button>`;
  row.querySelector('.material-name').value = material.name || '';
  row.querySelector('.material-quantity').value = material.quantity ?? '';
  row.querySelector('.material-price').value = material.price ?? '';
  row.querySelector('.material-remove').addEventListener('click', () => {
    row.remove();
    scheduleInterventionSave();
    updateInterventionTotal();
  });
  document.getElementById('intervention-materials').appendChild(row);
}

function collectInterventionForm() {
  const clients = getInterventionClients();
  const client = clients.find(item => item.id === document.getElementById('intervention-client').value);
  const previous = getInterventions().find(item => item.id === currentInterventionId) || {};
  const materials = [...document.querySelectorAll('.intervention-material-row')].map(row => ({
    name: row.querySelector('.material-name').value.trim(),
    quantity: Number(row.querySelector('.material-quantity').value) || 0,
    price: Number(row.querySelector('.material-price').value) || 0
  })).filter(item => item.name || item.quantity || item.price);

  return {
    ...previous,
    id: currentInterventionId,
    clientId: client?.id || '',
    clientName: client?.name || '',
    dateTime: document.getElementById('intervention-datetime').value,
    type: document.getElementById('intervention-type').value,
    description: document.getElementById('intervention-description').value,
    materials,
    notes: document.getElementById('intervention-notes').value,
    photos: previous.photos || [],
    signature: previous.signature || '',
    status: document.getElementById('intervention-status').value,
    updatedAt: new Date().toISOString()
  };
}

function saveCurrentIntervention(showConfirmation = false) {
  if (!currentInterventionId) return false;
  const data = collectInterventionForm();
  const entries = getInterventions();
  const index = entries.findIndex(item => item.id === data.id);
  if (index >= 0) entries[index] = data;
  else entries.push(data);

  const saved = DB.set('interventions', entries);
  const state = document.getElementById('intervention-save-state');
  if (state) {
    state.textContent = saved ? 'Enregistré sur cet appareil' : 'Stockage local indisponible';
    state.classList.toggle('save-error', !saved);
  }
  if (saved) renderInterventionsList();
  if (showConfirmation && !saved) alert('La sauvegarde locale a échoué. Libérez de l’espace sur cet appareil puis réessayez.');
  return saved;
}

function scheduleInterventionSave() {
  const state = document.getElementById('intervention-save-state');
  if (state) state.textContent = 'Enregistrement…';
  clearTimeout(interventionSaveTimer);
  interventionSaveTimer = setTimeout(() => saveCurrentIntervention(), 250);
}

function openIntervention(id = null) {
  const saved = getInterventions().find(item => item.id === id);
  const intervention = saved || {
    id: uid(), clientId: '', clientName: '', dateTime: localDateTimeValue(),
    type: 'Dépannage', description: '', materials: [], notes: [], photos: [],
    signature: '', status: 'todo', createdAt: new Date().toISOString()
  };
  currentInterventionId = intervention.id;
  document.getElementById('intervention-detail-title').textContent = saved ? 'Intervention' : 'Nouvelle intervention';
  renderInterventionClients(intervention.clientId);
  document.getElementById('intervention-datetime').value = intervention.dateTime || localDateTimeValue();
  document.getElementById('intervention-type').value = intervention.type || 'Autre';
  document.getElementById('intervention-status').value = intervention.status || 'todo';
  document.getElementById('intervention-description').value = intervention.description || '';
  document.getElementById('intervention-notes').value = intervention.notes || '';
  document.getElementById('intervention-materials').innerHTML = '';
  (intervention.materials || []).forEach(addInterventionMaterialRow);
  if (!(intervention.materials || []).length) addInterventionMaterialRow();
  document.getElementById('intervention-delete').hidden = !saved;
  document.getElementById('new-client-form').hidden = true;
  document.getElementById('new-client-name').value = '';
  document.getElementById('new-client-phone').value = '';
  document.getElementById('new-client-address').value = '';
  renderInterventionPhotos(intervention.photos || []);
  updateInterventionTotal();
  const state = document.getElementById('intervention-save-state');
  state.textContent = saved ? 'Enregistré sur cet appareil' : 'Nouveau brouillon';
  showScreen('screen-intervention-detail');
  setupSignatureCanvas(intervention.signature || '');
  if (!saved) saveCurrentIntervention();
}

function renderInterventionPhotos(photos) {
  const gallery = document.getElementById('intervention-photos');
  gallery.innerHTML = '';
  photos.forEach((photo, index) => {
    const item = document.createElement('figure');
    item.className = 'intervention-photo';
    const image = document.createElement('img');
    image.src = photo.data;
    image.alt = `Photo du chantier ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'photo-remove';
    remove.setAttribute('aria-label', `Supprimer la photo ${index + 1}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      const data = collectInterventionForm();
      data.photos = data.photos.filter((_, photoIndex) => photoIndex !== index);
      updateStoredIntervention(data);
      renderInterventionPhotos(data.photos);
    });
    item.append(image, remove);
    gallery.appendChild(item);
  });
}

function updateStoredIntervention(data) {
  const entries = getInterventions();
  const index = entries.findIndex(item => item.id === data.id);
  if (index >= 0) entries[index] = data;
  else entries.push(data);
  const saved = DB.set('interventions', entries);
  const state = document.getElementById('intervention-save-state');
  state.textContent = saved ? 'Enregistré sur cet appareil' : 'Stockage local indisponible';
  state.classList.toggle('save-error', !saved);
  if (saved) renderInterventionsList();
  return saved;
}

function updateInterventionTotal() {
  const total = [...document.querySelectorAll('.intervention-material-row')].reduce((sum, row) => {
    return sum + (Number(row.querySelector('.material-quantity').value) || 0) *
      (Number(row.querySelector('.material-price').value) || 0);
  }, 0);
  document.getElementById('intervention-total').textContent = formatEuro(total);
}

function setupSignatureCanvas(signature) {
  const canvas = document.getElementById('intervention-signature');
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#f0f2f5';
  context.lineWidth = 2.5;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (signature) {
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
    image.src = signature;
  }
}

function signaturePoint(event) {
  const canvas = document.getElementById('intervention-signature');
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function saveSignature() {
  const canvas = document.getElementById('intervention-signature');
  const data = collectInterventionForm();
  data.signature = canvas.toDataURL('image/png');
  updateStoredIntervention(data);
}

function compressInterventionPhoto(file) {
  return new Promise((resolve, reject) => {
    const finish = (image) => {
      const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.68));
    };
    if (window.createImageBitmap) {
      createImageBitmap(file).then(finish).catch(reject);
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); finish(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    image.src = url;
  });
}

async function addInterventionPhotos(files) {
  const current = getInterventions().find(item => item.id === currentInterventionId);
  const photos = current?.photos || [];
  const available = 5 - photos.length;
  if (available <= 0) {
    alert('Maximum 5 photos par intervention.');
    return;
  }
  const selected = [...files].slice(0, available);
  if (files.length > available) alert('Maximum 5 photos par intervention. Les premières photos ont été ajoutées.');
  try {
    const compressed = await Promise.all(selected.map(compressInterventionPhoto));
    const data = collectInterventionForm();
    data.photos = [...photos, ...compressed.map((photo, index) => ({
      id: uid(), data: photo, name: selected[index].name
    }))];
    if (updateStoredIntervention(data)) renderInterventionPhotos(data.photos);
    else alert('Espace de stockage local insuffisant pour enregistrer les photos.');
  } catch (error) {
    console.error('Ajout des photos impossible', error);
    alert('Une ou plusieurs photos n’ont pas pu être ajoutées.');
  }
  document.getElementById('intervention-photo-input').value = '';
}

function generateInterventionReport() {
  if (!saveCurrentIntervention(true)) return;
  const item = getInterventions().find(entry => entry.id === currentInterventionId);
  if (!item) return;
  const popup = window.open('', '_blank');
  if (!popup) {
    alert('Autorisez les fenêtres contextuelles pour générer le compte-rendu.');
    return;
  }
  const client = getInterventionClients().find(entry => entry.id === item.clientId);
  const date = item.dateTime ? new Date(item.dateTime).toLocaleString('fr-FR', {
    dateStyle: 'long', timeStyle: 'short'
  }) : 'Non renseignée';
  const materials = (item.materials || []).filter(line => line.name).map(line => `
    <tr><td>${interventionEscape(line.name)}</td><td>${line.quantity}</td>
    <td>${formatEuro(line.price)}</td><td>${formatEuro(line.quantity * line.price)}</td></tr>`).join('');
  const photos = (item.photos || []).map(photo => `<img src="${interventionEscape(photo.data)}" alt="Photo du chantier">`).join('');
  popup.document.write(`<!DOCTYPE html><html lang="fr"><meta charset="UTF-8"><title>Compte-rendu d’intervention</title>
    <style>body{font:15px Arial,sans-serif;color:#17202a;max-width:850px;margin:36px auto;padding:0 24px}h1{font-size:25px;border-bottom:2px solid #dc7620;padding-bottom:12px}h2{font-size:16px;margin:26px 0 8px}.meta{color:#52616b;line-height:1.8}.content{white-space:pre-wrap;line-height:1.55}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #d8dde2;padding:9px}th{background:#f2f4f5}.photos{display:flex;flex-wrap:wrap;gap:10px}.photos img{width:190px;height:145px;object-fit:cover}.signature{max-width:280px;max-height:130px;border-bottom:1px solid #777}.sign-row{display:flex;gap:50px;margin-top:42px}.sign-row div{flex:1;border-top:1px solid #777;padding-top:7px}@media print{body{margin:10mm auto}}</style>
    <body><h1>Compte-rendu d’intervention</h1>
    <div class="meta"><strong>Client :</strong> ${interventionEscape(item.clientName || 'Non renseigné')}<br>
    <strong>Adresse :</strong> ${interventionEscape(client?.address || 'Non renseignée')}<br>
    <strong>Date :</strong> ${interventionEscape(date)}<br>
    <strong>Type :</strong> ${interventionEscape(item.type)}<br>
    <strong>Statut :</strong> ${interventionEscape(INTERVENTION_STATUS[item.status]?.label || 'À faire')}</div>
    <h2>Travaux réalisés</h2><div class="content">${interventionEscape(item.description || 'Non renseignés')}</div>
    <h2>Matériel utilisé</h2><table><thead><tr><th>Désignation</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
    <tbody>${materials || '<tr><td colspan="4">Aucun matériel renseigné</td></tr>'}</tbody></table>
    <p><strong>Total matériel :</strong> ${formatEuro((item.materials || []).reduce((sum, line) => sum + line.quantity * line.price, 0))}</p>
    <h2>Notes techniques</h2><div class="content">${interventionEscape(item.notes || 'Aucune')}</div>
    ${photos ? `<h2>Photos du chantier</h2><div class="photos">${photos}</div>` : ''}
    <h2>Signature du client</h2>${item.signature ? `<img class="signature" src="${interventionEscape(item.signature)}" alt="Signature du client">` : '<p>Non signée</p>'}
    <div class="sign-row"><div>Signature du client</div><div>Date</div></div>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
  popup.document.close();
}

document.addEventListener('DOMContentLoaded', () => {
  renderInterventionsList();
  document.getElementById('intervention-history-client').addEventListener('change', renderInterventionsList);
  document.getElementById('intervention-new').addEventListener('click', () => openIntervention());
  document.getElementById('intervention-new-from-detail').addEventListener('click', () => openIntervention());
  document.getElementById('intervention-add-client').addEventListener('click', () => {
    document.getElementById('new-client-form').hidden = false;
    document.getElementById('new-client-name').focus();
  });
  document.getElementById('new-client-cancel').addEventListener('click', () => {
    document.getElementById('new-client-form').hidden = true;
  });
  document.getElementById('new-client-save').addEventListener('click', () => {
    const name = document.getElementById('new-client-name').value.trim();
    if (!name) {
      document.getElementById('new-client-name').focus();
      return;
    }
    const clients = getInterventionClients();
    const client = {
      id: uid(), name,
      phone: document.getElementById('new-client-phone').value.trim(),
      address: document.getElementById('new-client-address').value.trim()
    };
    clients.push(client);
    if (!DB.set('clients', clients)) {
      alert('Impossible d’enregistrer le client sur cet appareil.');
      return;
    }
    renderInterventionClients(client.id);
    document.getElementById('new-client-form').hidden = true;
    renderInterventionsList();
    scheduleInterventionSave();
  });

  document.getElementById('intervention-add-material').addEventListener('click', () => {
    addInterventionMaterialRow();
    scheduleInterventionSave();
  });
  const form = document.getElementById('intervention-form');
  form.addEventListener('input', event => {
    if (event.target.matches('.material-quantity, .material-price')) updateInterventionTotal();
    scheduleInterventionSave();
  });
  form.addEventListener('change', scheduleInterventionSave);
  document.getElementById('intervention-save').addEventListener('click', () => saveCurrentIntervention(true));
  document.getElementById('intervention-status').addEventListener('change', () => saveCurrentIntervention());
  document.getElementById('intervention-delete').addEventListener('click', () => {
    if (!confirm('Supprimer définitivement cette intervention ?')) return;
    DB.set('interventions', getInterventions().filter(item => item.id !== currentInterventionId));
    currentInterventionId = null;
    renderInterventionsList();
    goBack();
  });
  document.getElementById('intervention-photo-input').addEventListener('change', event => {
    if (event.target.files?.length) addInterventionPhotos(event.target.files);
  });
  document.getElementById('intervention-report').addEventListener('click', generateInterventionReport);

  const canvas = document.getElementById('intervention-signature');
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    signatureDrawing = true;
    canvas.setPointerCapture(event.pointerId);
    const point = signaturePoint(event);
    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(point.x, point.y);
  });
  canvas.addEventListener('pointermove', event => {
    if (!signatureDrawing) return;
    const point = signaturePoint(event);
    const context = canvas.getContext('2d');
    context.lineTo(point.x, point.y);
    context.stroke();
  });
  const finishSignature = () => {
    if (!signatureDrawing) return;
    signatureDrawing = false;
    saveSignature();
  };
  canvas.addEventListener('pointerup', finishSignature);
  canvas.addEventListener('pointercancel', finishSignature);
  document.getElementById('intervention-signature-clear').addEventListener('click', () => {
    setupSignatureCanvas('');
    const data = collectInterventionForm();
    data.signature = '';
    updateStoredIntervention(data);
  });

  window.addEventListener('resize', () => {
    const detail = document.getElementById('screen-intervention-detail');
    if (detail.classList.contains('active')) {
      const item = getInterventions().find(entry => entry.id === currentInterventionId);
      setupSignatureCanvas(item?.signature || '');
    }
  });
  window.addEventListener('beforeunload', () => {
    clearTimeout(interventionSaveTimer);
    saveCurrentIntervention();
  });
});
