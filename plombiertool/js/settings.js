/* ===================== settings.js =====================
   Paramètres de l'application : thème clair/sombre, export et
   suppression des données locales.
*/

function applyTheme(dark) {
  document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#0d1117' : '#f4f5f7');
}

document.addEventListener('DOMContentLoaded', () => {
  const isDark = DB.get('setting_theme_dark', true);
  document.getElementById('setting-theme').checked = isDark;
  applyTheme(isDark);

  document.getElementById('setting-theme').addEventListener('change', (e) => {
    DB.set('setting_theme_dark', e.target.checked);
    applyTheme(e.target.checked);
  });

  document.getElementById('btn-export-data').addEventListener('click', () => {
    const data = {
      devis_list: DB.get('devis_list', []),
      checklists: DB.get('checklists', []),
      fiches: DB.get('fiches', []),
      clients: DB.get('clients', []),
      interventions: DB.get('interventions', []),
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plombiertool-donnees.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-clear-data').addEventListener('click', () => {
    if (!confirm('Cette action supprimera définitivement tous les devis, checklists, fiches chantier et interventions enregistrés sur cet appareil. Continuer ?')) return;
    DB.remove('devis_list');
    DB.remove('checklists');
    DB.remove('fiches');
    DB.remove('clients');
    DB.remove('interventions');
    alert('Toutes les données ont été supprimées. L\'application va se recharger.');
    location.reload();
  });
});
