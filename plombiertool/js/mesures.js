/* ===================== mesures.js =====================
   Module "Mesures & conversions" : conversions d'unités et calculs
   géométriques rapides utilisés sur chantier.
*/

const MESURES_TOOLS = [
  {
    id: 'mm-cm-m', name: 'mm ↔ cm ↔ m', sub: 'Longueurs',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Conversion mm / cm / m',
        explanation: 'Convertit une longueur entre millimètres, centimètres et mètres.',
        formula: '1 m = 100 cm = 1000 mm',
        inputsHTML: `
          <label>Millimètres (mm)</label>
          <input type="number" id="in-mm" class="input-field" placeholder="Ex : 1500">
          <label>ou centimètres (cm)</label>
          <input type="number" id="in-cm" class="input-field" placeholder="Ex : 150">
          <label>ou mètres (m)</label>
          <input type="number" id="in-m" class="input-field" placeholder="Ex : 1.5">`
      });
      const mm = document.getElementById('in-mm');
      const cm = document.getElementById('in-cm');
      const m = document.getElementById('in-m');
      const res = document.getElementById('tool-result');
      function fromMM(v) { mm.value = v; cm.value = ''; m.value = ''; showAll(v); }
      function showAll(vMM) {
        res.innerHTML = `${vMM.toFixed(1)} mm <br><span style="font-size:14px;font-weight:400;">${(vMM/10).toFixed(2)} cm — ${(vMM/1000).toFixed(4)} m</span>`;
      }
      mm.addEventListener('input', () => { if (mm.value==='') return; cm.value=''; m.value=''; showAll(parseFloat(mm.value)); });
      cm.addEventListener('input', () => { if (cm.value==='') return; mm.value=''; m.value=''; showAll(parseFloat(cm.value)*10); });
      m.addEventListener('input', () => { if (m.value==='') return; mm.value=''; cm.value=''; showAll(parseFloat(m.value)*1000); });
    }
  },
  {
    id: 'pouces-mm', name: 'Pouces ↔ mm', sub: 'Diamètres nominaux',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Pouces ↔ Millimètres',
        explanation: 'Convertit une mesure entre pouces (inch) et millimètres — pratique pour les diamètres de tubes.',
        formula: '1 pouce (") = 25,4 mm',
        inputsHTML: `
          <label>Valeur en pouces</label>
          <input type="number" id="in-inch" class="input-field" placeholder='Ex : 0.5 (1/2")'>
          <label>ou valeur en mm</label>
          <input type="number" id="in-mmv" class="input-field" placeholder="Ex : 12.7">`
      });
      const inch = document.getElementById('in-inch');
      const mmv = document.getElementById('in-mmv');
      const res = document.getElementById('tool-result');
      inch.addEventListener('input', () => { if (inch.value==='') return; mmv.value=''; res.textContent = (parseFloat(inch.value)*25.4).toFixed(2) + ' mm'; });
      mmv.addEventListener('input', () => { if (mmv.value==='') return; inch.value=''; res.textContent = (parseFloat(mmv.value)/25.4).toFixed(3) + ' "'; });
    }
  },
  {
    id: 'diam-circ', name: 'Diamètre ↔ Circonférence', sub: 'C = π × D',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Diamètre ↔ Circonférence',
        explanation: 'Calcule la circonférence d\'un tube à partir de son diamètre, ou l\'inverse — utile pour le cintrage.',
        formula: 'C = π × D',
        inputsHTML: `
          <label>Diamètre (mm)</label>
          <input type="number" id="in-diam" class="input-field" placeholder="Ex : 16">
          <label>ou circonférence (mm)</label>
          <input type="number" id="in-circ" class="input-field" placeholder="Ex : 50.3">`
      });
      const diam = document.getElementById('in-diam');
      const circ = document.getElementById('in-circ');
      const res = document.getElementById('tool-result');
      diam.addEventListener('input', () => { if (diam.value==='') return; circ.value=''; res.textContent = (parseFloat(diam.value)*Math.PI).toFixed(2) + ' mm'; });
      circ.addEventListener('input', () => { if (circ.value==='') return; diam.value=''; res.textContent = (parseFloat(circ.value)/Math.PI).toFixed(2) + ' mm'; });
    }
  },
  {
    id: 'pente-pct', name: 'Calcul de pente en %', sub: 'Évacuations',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Pente en pourcentage',
        explanation: 'Calcule la pente d\'une canalisation en pourcentage à partir du dénivelé et de la longueur.',
        formula: 'Pente (%) = (Dénivelé / Longueur) × 100',
        inputsHTML: `
          <label>Dénivelé (mm)</label>
          <input type="number" id="in-deniv" class="input-field" placeholder="Ex : 20">
          <label>Longueur (mm)</label>
          <input type="number" id="in-long" class="input-field" placeholder="Ex : 1000">`,
        warning: 'Les évacuations EU/EV nécessitent généralement une pente entre 1 % et 3 % ; référez-vous au DTU 60.11 et aux règles du chantier.'
      });
      liveCalc(['in-deniv', 'in-long'], (d, l) => {
        if (l === 0) return 'Longueur invalide';
        return `${((d / l) * 100).toFixed(2)} %`;
      });
    }
  },
  {
    id: 'pente-mmm', name: 'Calcul de pente en mm/m', sub: 'Évacuations',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Pente en mm par mètre',
        explanation: 'Calcule le dénivelé en mm pour chaque mètre linéaire, à partir d\'une pente en %.',
        formula: 'mm/m = Pente (%) × 10',
        inputsHTML: `
          <label>Pente (%)</label>
          <input type="number" id="in-pct" class="input-field" placeholder="Ex : 2">`
      });
      liveCalc(['in-pct'], (p) => `${(p * 10).toFixed(1)} mm/m`);
    }
  },
  {
    id: 'longueur', name: 'Calcul de longueur (Pythagore)', sub: 'c = √(a² + b²)',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Longueur d\'une diagonale / d\'un tube en biais',
        explanation: 'Calcule la longueur d\'un segment en biais à partir de deux côtés perpendiculaires (théorème de Pythagore).',
        formula: 'c = √(a² + b²)',
        inputsHTML: `
          <label>Côté a (mm)</label>
          <input type="number" id="in-a" class="input-field" placeholder="Ex : 300">
          <label>Côté b (mm)</label>
          <input type="number" id="in-b" class="input-field" placeholder="Ex : 400">`
      });
      liveCalc(['in-a', 'in-b'], (a, b) => `${Math.sqrt(a * a + b * b).toFixed(1)} mm`);
    }
  },
  {
    id: 'angle', name: 'Calcul d\'angle', sub: 'tan(θ) = opposé / adjacent',
    render(box) {
      box.innerHTML = toolTemplate({
        title: 'Calcul d\'un angle de coude',
        explanation: 'Calcule l\'angle formé à partir de deux côtés d\'un triangle rectangle (ex : décalage d\'un tube).',
        formula: 'θ = arctan(opposé / adjacent)',
        inputsHTML: `
          <label>Côté opposé (mm)</label>
          <input type="number" id="in-opp" class="input-field" placeholder="Ex : 100">
          <label>Côté adjacent (mm)</label>
          <input type="number" id="in-adj" class="input-field" placeholder="Ex : 200">`
      });
      liveCalc(['in-opp', 'in-adj'], (o, a) => {
        if (a === 0) return 'Valeur invalide';
        const deg = Math.atan(o / a) * (180 / Math.PI);
        return `${deg.toFixed(1)} °`;
      });
    }
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initToolScreen('mesures-list', 'mesures-detail', MESURES_TOOLS);
});
