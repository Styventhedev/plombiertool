/* ===================== hydraulique.js =====================
   Module "Calculs hydrauliques" : conversions et calculs de base
   utiles sur chantier (pression, débit, volume, vitesse, perte de charge).
*/

function liveCalc(ids, compute) {
  const inputs = ids.map(id => document.getElementById(id));
  const resultEl = document.getElementById('tool-result');
  function update() {
    const values = inputs.map(i => parseFloat(i.value));
    if (values.some(v => isNaN(v))) {
      resultEl.textContent = 'Renseignez les valeurs ci-dessus';
      return;
    }
    resultEl.innerHTML = compute(...values);
  }
  inputs.forEach(i => i.addEventListener('input', update));
  update();
}

const HYDRO_TOOLS = [
  {
    id: 'bar-pa', name: 'Conversion bar ↔ Pa', sub: 'Pression',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Bar ↔ Pascal',
        explanation: 'Convertit une pression entre bars et pascals.',
        formula: '1 bar = 100 000 Pa',
        inputsHTML: `
          <label>Valeur en bar</label>
          <input type="number" id="in-bar" class="input-field" placeholder="Ex : 3">
          <label>ou valeur en Pa</label>
          <input type="number" id="in-pa" class="input-field" placeholder="Ex : 300000">`
      });
      const bar = document.getElementById('in-bar');
      const pa = document.getElementById('in-pa');
      const res = document.getElementById('tool-result');
      bar.addEventListener('input', () => {
        if (bar.value === '') return;
        pa.value = '';
        res.textContent = (parseFloat(bar.value) * 100000).toLocaleString('fr-FR') + ' Pa';
      });
      pa.addEventListener('input', () => {
        if (pa.value === '') return;
        bar.value = '';
        res.textContent = (parseFloat(pa.value) / 100000).toLocaleString('fr-FR') + ' bar';
      });
    }
  },
  {
    id: 'lmin-m3h', name: 'Conversion L/min ↔ m³/h', sub: 'Débit',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'L/min ↔ m³/h',
        explanation: 'Convertit un débit entre litres par minute et mètres cubes par heure.',
        formula: '1 m³/h = 16,667 L/min',
        inputsHTML: `
          <label>Débit en L/min</label>
          <input type="number" id="in-lmin" class="input-field" placeholder="Ex : 20">
          <label>ou débit en m³/h</label>
          <input type="number" id="in-m3h" class="input-field" placeholder="Ex : 1.2">`
      });
      const lmin = document.getElementById('in-lmin');
      const m3h = document.getElementById('in-m3h');
      const res = document.getElementById('tool-result');
      lmin.addEventListener('input', () => {
        if (lmin.value === '') return;
        m3h.value = '';
        res.textContent = (parseFloat(lmin.value) * 0.06).toFixed(3) + ' m³/h';
      });
      m3h.addEventListener('input', () => {
        if (m3h.value === '') return;
        lmin.value = '';
        res.textContent = (parseFloat(m3h.value) / 0.06).toFixed(2) + ' L/min';
      });
    }
  },
  {
    id: 'debit', name: 'Calcul de débit', sub: 'Q = V / t',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Calcul de débit',
        explanation: 'Calcule le débit à partir d\'un volume écoulé pendant un temps donné.',
        formula: 'Q = V / t',
        inputsHTML: `
          <label>Volume (litres)</label>
          <input type="number" id="in-v" class="input-field" placeholder="Ex : 10">
          <label>Temps (secondes)</label>
          <input type="number" id="in-t" class="input-field" placeholder="Ex : 30">`
      });
      liveCalc(['in-v', 'in-t'], (v, t) => {
        if (t === 0) return 'Temps invalide';
        const qLs = v / t;
        return `${qLs.toFixed(3)} L/s <br><span style="font-size:14px;font-weight:400;">soit ${(qLs * 60).toFixed(2)} L/min</span>`;
      });
    }
  },
  {
    id: 'volume', name: 'Calcul de volume', sub: 'V = π × r² × L (tube cylindrique)',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Volume d\'un tube cylindrique',
        explanation: 'Calcule le volume intérieur d\'un tube à partir de son diamètre intérieur et sa longueur.',
        formula: 'V = π × (Ø/2)² × L',
        inputsHTML: `
          <label>Diamètre intérieur (mm)</label>
          <input type="number" id="in-d" class="input-field" placeholder="Ex : 16">
          <label>Longueur (m)</label>
          <input type="number" id="in-l" class="input-field" placeholder="Ex : 5">`
      });
      liveCalc(['in-d', 'in-l'], (d, l) => {
        const rM = (d / 1000) / 2;
        const volM3 = Math.PI * rM * rM * l;
        return `${(volM3 * 1000).toFixed(3)} L <br><span style="font-size:14px;font-weight:400;">soit ${volM3.toFixed(6)} m³</span>`;
      });
    }
  },
  {
    id: 'vitesse', name: 'Vitesse d\'écoulement', sub: 'v = Q / S',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Vitesse d\'écoulement dans un tube',
        explanation: 'Calcule la vitesse de l\'eau dans un tube à partir du débit et du diamètre intérieur.',
        formula: 'v = Q / S, avec S = π × (Ø/2)²',
        inputsHTML: `
          <label>Débit (L/min)</label>
          <input type="number" id="in-q" class="input-field" placeholder="Ex : 20">
          <label>Diamètre intérieur (mm)</label>
          <input type="number" id="in-d" class="input-field" placeholder="Ex : 16">`,
        warning: 'Une vitesse recommandée se situe généralement entre 0,5 et 2 m/s en eau froide selon le DTU 60.11 ; vérifiez les préconisations en vigueur pour votre installation.'
      });
      liveCalc(['in-q', 'in-d'], (q, d) => {
        const qM3s = (q / 1000) / 60;
        const rM = (d / 1000) / 2;
        const s = Math.PI * rM * rM;
        if (s === 0) return 'Diamètre invalide';
        const v = qM3s / s;
        return `${v.toFixed(2)} m/s`;
      });
    }
  },
  {
    id: 'perte-charge', name: 'Perte de charge (approximative)', sub: 'Formule simplifiée',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Perte de charge linéaire (estimation)',
        explanation: 'Donne un ordre de grandeur simplifié de la perte de charge linéaire, à titre indicatif seulement.',
        formula: 'ΔP ≈ λ × (L/D) × (ρ × v² / 2), avec λ ≈ 0,03 (estimation générique)',
        inputsHTML: `
          <label>Longueur du réseau (m)</label>
          <input type="number" id="in-l" class="input-field" placeholder="Ex : 10">
          <label>Diamètre intérieur (mm)</label>
          <input type="number" id="in-d" class="input-field" placeholder="Ex : 16">
          <label>Vitesse d'écoulement (m/s)</label>
          <input type="number" id="in-v" class="input-field" placeholder="Ex : 1.2">`,
        warning: 'RÉSULTAT APPROXIMATIF. Le coefficient de frottement réel dépend du matériau, de la rugosité et du régime d\'écoulement. Pour un dimensionnement réel, utilisez les abaques du fabricant ou les méthodes normalisées (DTU 60.11).'
      });
      liveCalc(['in-l', 'in-d', 'in-v'], (l, d, v) => {
        const rho = 1000; // masse volumique de l'eau kg/m3
        const lambda = 0.03; // coefficient générique approximatif
        const dM = d / 1000;
        if (dM === 0) return 'Diamètre invalide';
        const deltaPPa = lambda * (l / dM) * (rho * v * v / 2);
        return `≈ ${(deltaPPa / 1000).toFixed(2)} kPa <br><span style="font-size:14px;font-weight:400;">≈ ${(deltaPPa / 100000).toFixed(4)} bar</span>`;
      });
    }
  },
  {
    id: 'pression', name: 'Calcul de pression', sub: 'P = ρ × g × h',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Pression due à une hauteur d\'eau',
        explanation: 'Calcule la pression statique générée par une colonne d\'eau (utile pour les pertes de charge liées à la hauteur).',
        formula: 'P = ρ × g × h (ρ = 1000 kg/m³, g = 9,81 m/s²)',
        inputsHTML: `
          <label>Hauteur de la colonne d'eau (m)</label>
          <input type="number" id="in-h" class="input-field" placeholder="Ex : 8">`
      });
      liveCalc(['in-h'], (h) => {
        const pPa = 1000 * 9.81 * h;
        return `${pPa.toLocaleString('fr-FR', {maximumFractionDigits: 0})} Pa <br><span style="font-size:14px;font-weight:400;">soit ${(pPa / 100000).toFixed(3)} bar</span>`;
      });
    }
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initToolScreen('hydro-list', 'hydro-detail', HYDRO_TOOLS);
});
