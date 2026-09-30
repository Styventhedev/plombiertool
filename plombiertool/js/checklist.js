/* ===================== checklist.js =====================
   Checklists personnalisables (plusieurs listes possibles), sauvegardées
   dans le localStorage. Une checklist "Outillage de base" est fournie par défaut.
*/

const DEFAULT_CHECKLIST = {
  id: 'default',
  name: 'Outillage de base',
  items: [
    { id: uid(), label: 'Coupe-tube', checked: false },
    { id: uid(), label: 'Clé à molette', checked: false },
    { id: uid(), label: 'Clé à pipe', checked: false },
    { id: uid(), label: 'Pince multiprise', checked: false },
    { id: uid(), label: 'Chalumeau', checked: false },
    { id: uid(), label: 'Décapant', checked: false },
    { id: uid(), label: 'Filasse', checked: false },
    { id: uid(), label: 'Téflon', checked: false },
    { id: uid(), label: 'Raccords', checked: false },
    { id: uid(), label: 'Multicouche', checked: false },
    { id: uid(), label: 'PER', checked: false },
    { id: uid(), label: 'Cuivre', checked: false },
    { id: uid(), label: 'EPI', checked: false },
  ]
};

let currentChecklistId = null;

function getChecklists() {
  let lists = DB.get('checklists', null);
  if (!lists || lists.length === 0) {
    lists = [DEFAULT_CHECKLIST];
    DB.set('checklists', lists);
  }
  return lists;
}

function saveChecklists(lists) {
  DB.set('checklists', lists);
}

function renderChecklistSelect() {
  const lists = getChecklists();
  const select = document.getElementById('checklist-select');
  select.innerHTML = '';
  lists.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = l.name;
    select.appendChild(opt);
  });
  if (!currentChecklistId || !lists.find(l => l.id === currentChecklistId)) {
    currentChecklistId = lists[0].id;
  }
  select.value = currentChecklistId;
}

function renderChecklistItems() {
  const lists = getChecklists();
  const list = lists.find(l => l.id === currentChecklistId) || lists[0];
  const container = document.getElementById('checklist-items');
  container.innerHTML = '';

  if (!list.items.length) {
    container.innerHTML = '<p class="muted">Cette liste est vide. Ajoutez un élément ci-dessous.</p>';
    return;
  }

  list.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'check-item' + (item.checked ? ' checked' : '');
    row.innerHTML = `
      <input type="checkbox" ${item.checked ? 'checked' : ''}>
      <span>${escapeHtml(item.label)}</span>
      <button class="remove-item" title="Supprimer">✕</button>`;
    row.querySelector('input').addEventListener('change', (e) => {
      item.checked = e.target.checked;
      saveChecklists(lists);
      row.classList.toggle('checked', item.checked);
    });
    row.querySelector('.remove-item').addEventListener('click', () => {
      list.items = list.items.filter(i => i.id !== item.id);
      saveChecklists(lists);
      renderChecklistItems();
    });
    container.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderChecklistSelect();
  renderChecklistItems();

  document.getElementById('checklist-select').addEventListener('change', (e) => {
    currentChecklistId = e.target.value;
    renderChecklistItems();
  });

  document.getElementById('checklist-new').addEventListener('click', () => {
    const name = prompt('Nom de la nouvelle checklist :');
    if (!name) return;
    const lists = getChecklists();
    const newList = { id: uid(), name, items: [] };
    lists.push(newList);
    saveChecklists(lists);
    currentChecklistId = newList.id;
    renderChecklistSelect();
    renderChecklistItems();
  });

  document.getElementById('checklist-add-item').addEventListener('click', () => {
    const input = document.getElementById('checklist-new-item');
    const label = input.value.trim();
    if (!label) return;
    const lists = getChecklists();
    const list = lists.find(l => l.id === currentChecklistId);
    list.items.push({ id: uid(), label, checked: false });
    saveChecklists(lists);
    input.value = '';
    renderChecklistItems();
  });

  document.getElementById('checklist-new-item').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('checklist-add-item').click();
  });

  document.getElementById('checklist-delete').addEventListener('click', () => {
    const lists = getChecklists();
    if (lists.length <= 1) {
      alert('Impossible de supprimer la dernière checklist restante.');
      return;
    }
    if (!confirm('Supprimer définitivement cette checklist ?')) return;
    const remaining = lists.filter(l => l.id !== currentChecklistId);
    saveChecklists(remaining);
    currentChecklistId = remaining[0].id;
    renderChecklistSelect();
    renderChecklistItems();
  });
});
