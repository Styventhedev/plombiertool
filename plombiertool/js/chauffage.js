/* ===================== chauffage.js =====================
   Module "Chauffage" : estimations de volume, besoins, puissance,
   conversions de température. Toutes les estimations de dimensionnement
   sont clairement annoncées comme approximatives.
*/

const DIMENSIONNEMENT_WARNING = 'ESTIMATION UNIQUEMENT. Un dimensionnement réel de chauffage doit respecter la réglementation thermique en vigueur, la déperdition réelle du bâtiment (isolation, exposition, zone climatique) et être validé par un professionnel qualifié (étude thermique, calcul selon DTU / RE en vigueur).';

const CHAUFFAGE_TOOLS = [
  {
    id: 'volume-piece', name: 'Volume d\'une pièce', sub: 'V = L × l × H',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Volume d\'une pièce',
        explanation: 'Calcule le volume d\'une pièce à partir de ses dimensions.',
        formula: 'V = Longueur × Largeur × Hauteur',
        inputsHTML: `
          <label>Longueur (m)</label>
          <input type="number" id="in-l" class="input-field" placeholder="Ex : 5">
          <label>Largeur (m)</label>
          <input type="number" id="in-w" class="input-field" placeholder="Ex : 4">
          <label>Hauteur sous plafond (m)</label>
          <input type="number" id="in-h" class="input-field" placeholder="Ex : 2.5">`
      });
      liveCalc(['in-l', 'in-w', 'in-h'], (l, w, h) => `${(l * w * h).toFixed(2)} m³`);
    }
  },
  {
    id: 'besoins-chauffage', name: 'Estimation besoins de chauffage', sub: 'Approximatif — Watts',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Estimation des besoins de chauffage',
        explanation: 'Donne un ordre de grandeur de la puissance nécessaire selon le volume et un coefficient d\'isolation approximatif.',
        formula: 'P (W) ≈ Volume (m³) × Coefficient',
        inputsHTML: `
          <label>Volume de la pièce (m³)</label>
          <input type="number" id="in-vol" class="input-field" placeholder="Ex : 50">
          <label>Niveau d'isolation</label>
          <select id="in-coef" class="input-field">
            <option value="30">Bâtiment récent / bien isolé (≈30 W/m³)</option>
            <option value="40" selected>Isolation moyenne (≈40 W/m³)</option>
            <option value="60">Isolation ancienne / faible (≈60 W/m³)</option>
            <option value="80">Très mal isolé (≈80 W/m³)</option>
          </select>`,
        warning: DIMENSIONNEMENT_WARNING
      });
      const vol = document.getElementById('in-vol');
      const coef = document.getElementById('in-coef');
      const res = document.getElementById('tool-result');
      function update() {
        const v = parseFloat(vol.value);
        const c = parseFloat(coef.value);
        if (isNaN(v)) { res.textContent = 'Renseignez les valeurs ci-dessus'; return; }
        res.innerHTML = `≈ ${Math.round(v * c).toLocaleString('fr-FR')} W`;
      }
      vol.addEventListener('input', update);
      coef.addEventListener('change', update);
      update();
    }
  },
  {
    id: 'puissance-radiateur', name: 'Puissance de radiateur', sub: 'Approximatif — Watts/m²',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Estimation puissance de radiateur',
        explanation: 'Estime la puissance de radiateur nécessaire pour une surface donnée.',
        formula: 'P (W) ≈ Surface (m²) × Coefficient (W/m²)',
        inputsHTML: `
          <label>Surface de la pièce (m²)</label>
          <input type="number" id="in-surf" class="input-field" placeholder="Ex : 20">
          <label>Niveau d'isolation</label>
          <select id="in-coef2" class="input-field">
            <option value="70">Bien isolé (≈70 W/m²)</option>
            <option value="100" selected>Isolation moyenne (≈100 W/m²)</option>
            <option value="130">Isolation ancienne (≈130 W/m²)</option>
          </select>`,
        warning: DIMENSIONNEMENT_WARNING
      });
      const surf = document.getElementById('in-surf');
      const coef = document.getElementById('in-coef2');
      const res = document.getElementById('tool-result');
      function update() {
        const s = parseFloat(surf.value);
        const c = parseFloat(coef.value);
        if (isNaN(s)) { res.textContent = 'Renseignez les valeurs ci-dessus'; return; }
        res.innerHTML = `≈ ${Math.round(s * c).toLocaleString('fr-FR')} W`;
      }
      surf.addEventListener('input', update);
      coef.addEventListener('change', update);
      update();
    }
  },
  {
    id: 'nb-radiateurs', name: 'Nombre de radiateurs', sub: 'Approximatif',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Estimation du nombre de radiateurs',
        explanation: 'Estime combien de radiateurs sont nécessaires selon la puissance totale requise et la puissance unitaire choisie.',
        formula: 'Nombre ≈ Puissance totale / Puissance unitaire',
        inputsHTML: `
          <label>Puissance totale nécessaire (W)</label>
          <input type="number" id="in-tot" class="input-field" placeholder="Ex : 3000">
          <label>Puissance unitaire d'un radiateur (W)</label>
          <input type="number" id="in-unit" class="input-field" placeholder="Ex : 1000">`,
        warning: DIMENSIONNEMENT_WARNING
      });
      liveCalc(['in-tot', 'in-unit'], (tot, unit) => {
        if (unit === 0) return 'Puissance unitaire invalide';
        return `${Math.ceil(tot / unit)} radiateur(s)`;
      });
    }
  },
  {
    id: 'c-f', name: 'Conversion °C ↔ °F', sub: 'Température',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Celsius ↔ Fahrenheit',
        explanation: 'Convertit une température entre degrés Celsius et Fahrenheit.',
        formula: '°F = °C × 9/5 + 32',
        inputsHTML: `
          <label>Température en °C</label>
          <input type="number" id="in-c" class="input-field" placeholder="Ex : 20">
          <label>ou température en °F</label>
          <input type="number" id="in-f" class="input-field" placeholder="Ex : 68">`
      });
      const c = document.getElementById('in-c');
      const f = document.getElementById('in-f');
      const res = document.getElementById('tool-result');
      c.addEventListener('input', () => {
        if (c.value === '') return;
        f.value = '';
        res.textContent = (parseFloat(c.value) * 9 / 5 + 32).toFixed(1) + ' °F';
      });
      f.addEventListener('input', () => {
        if (f.value === '') return;
        c.value = '';
        res.textContent = ((parseFloat(f.value) - 32) * 5 / 9).toFixed(1) + ' °C';
      });
    }
  },
  {
    id: 'depart-retour', name: 'Température départ / retour', sub: 'ΔT chauffage',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Écart départ / retour (ΔT)',
        explanation: 'Calcule l\'écart de température entre le départ et le retour d\'un circuit de chauffage, utile pour vérifier le bon fonctionnement d\'une installation.',
        formula: 'ΔT = T départ − T retour',
        inputsHTML: `
          <label>Température de départ (°C)</label>
          <input type="number" id="in-dep" class="input-field" placeholder="Ex : 60">
          <label>Température de retour (°C)</label>
          <input type="number" id="in-ret" class="input-field" placeholder="Ex : 50">`,
        warning: 'Un ΔT classique en chauffage central se situe généralement autour de 15 à 20 °C, mais cela dépend du type d\'émetteur et du réglage de l\'installation.'
      });
      liveCalc(['in-dep', 'in-ret'], (dep, ret) => `${(dep - ret).toFixed(1)} °C`);
    }
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initToolScreen('chauffage-list', 'chauffage-detail', CHAUFFAGE_TOOLS);
});
