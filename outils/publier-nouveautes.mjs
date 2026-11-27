#!/usr/bin/env node
/**
 * Rubrique « Nouveautés » du centre d'aide.
 *
 * Une note par mise en production : nouveautes/notes/AAAA-MM-JJ.md
 *
 *   ---
 *   titre: Documents RH plus souples
 *   resume: Une phrase, affichée dans la liste et dans l'application.
 *   modules: Documents RH, Projets
 *   ---
 *   ## Documents RH
 *   - **Onglet « Mes documents RH »** : …
 *
 * Puis : node outils/publier-nouveautes.mjs
 *
 * Le script régénère, sans aucune dépendance :
 *   nouveautes/index.html               la liste, la plus récente en tête
 *   nouveautes/AAAA-MM-JJ/index.html    une page par note
 *   nouveautes/releases.json            lu par l'application Leo RH (menu du lion)
 *   nouveautes/logo.png                 le logo, repris de index.html
 * et met à jour, dans index.html, le lien « Nouveautés » de la barre latérale
 * et le bandeau de la dernière nouveauté (entre les marqueurs nouveautes:*).
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = join(RACINE, 'nouveautes');
const NOTES = join(DOSSIER, 'notes');
const SITE = 'https://aide.leorh.com';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const dateLongue = (d) => { const [a, m, j] = d.split('-').map(Number); return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`; };
const dateCourte = (d) => { const [, m, j] = d.split('-').map(Number); return `${j} ${MOIS_COURT[m - 1]}`; };

const echapper = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Markdown réduit : titres ##/###, listes « - », paragraphes, **gras**, *italique*, [lien](url). */
function enHtml(md) {
  const enLigne = (t) => echapper(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => `<a href="${url}">${txt}</a>`);
  const sortie = [];
  let liste = null, para = [];
  const fermer = () => {
    if (para.length) { sortie.push(`<p>${enLigne(para.join(' '))}</p>`); para = []; }
    if (liste) { sortie.push(`<ul>${liste.map((l) => `<li>${enLigne(l)}</li>`).join('')}</ul>`); liste = null; }
  };
  for (const brute of md.split('\n')) {
    const l = brute.trim();
    if (!l) { fermer(); continue; }
    const titre = /^(#{2,3})\s+(.*)$/.exec(l);
    if (titre) { fermer(); sortie.push(`<h${titre[1].length}>${enLigne(titre[2])}</h${titre[1].length}>`); continue; }
    if (/^[-*]\s+/.test(l)) { if (para.length) fermer(); (liste ??= []).push(l.replace(/^[-*]\s+/, '')); continue; }
    if (liste) { liste[liste.length - 1] += ' ' + l; continue; }
    para.push(l);
  }
  fermer();
  return sortie.join('\n');
}

function lireNote(fichier) {
  const date = fichier.replace(/\.md$/, '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${fichier} : le nom doit être la date, AAAA-MM-JJ.md`);
  const texte = readFileSync(join(NOTES, fichier), 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(texte);
  if (!m) throw new Error(`${fichier} : en-tête --- titre / resume / modules --- manquant`);
  const meta = Object.fromEntries(m[1].split('\n').filter(Boolean).map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
  if (!meta.titre) throw new Error(`${fichier} : « titre » manquant`);
  if (!meta.resume) throw new Error(`${fichier} : « resume » manquant`);
  return {
    date, titre: meta.titre, resume: meta.resume,
    modules: (meta.modules || '').split(',').map((s) => s.trim()).filter(Boolean),
    html: enHtml(m[2]),
  };
}

const notes = readdirSync(NOTES).filter((f) => f.endsWith('.md')).map(lireNote)
  .sort((a, b) => b.date.localeCompare(a.date));
if (!notes.length) throw new Error('Aucune note dans nouveautes/notes');

// Le logo de la barre latérale, repris de index.html (intégré en base64).
const accueil = readFileSync(join(RACINE, 'index.html'), 'utf8');
const logo = /class="brand-logo" src="data:image\/png;base64,([^"]+)"/.exec(accueil);
if (logo) writeFileSync(join(DOSSIER, 'logo.png'), Buffer.from(logo[1], 'base64'));

const ICONES = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <symbol id="i-sparkles" viewBox="0 0 24 24"><path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/><path d="M20 3v4M22 5h-4"/></symbol>
  <symbol id="i-arrow-left" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7M19 12H5"/></symbol>
  <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></symbol>
  <symbol id="i-book" viewBox="0 0 24 24"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></symbol>
</svg>`;

/** Page commune : barre latérale du centre d'aide, liste des notes, contenu. */
function page({ titre, description, base, courante, contenu, canonique }) {
  const liens = notes.map((n) => `<a href="${base}${n.date}/"${n.date === courante ? ' class="active" aria-current="page"' : ''}><span class="d">${dateCourte(n.date)}</span><span class="t">${echapper(n.titre)}</span></a>`).join('\n      ');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapper(titre)}</title>
<meta name="description" content="${echapper(description)}">
<link rel="canonical" href="${canonique}">
<link rel="stylesheet" href="${base}style.css">
</head>
<body>
${ICONES}
<aside class="sidebar">
  <div class="brand">
    <a href="${base}../"><img class="brand-logo" src="${base}logo.png" alt="Leo RH"></a>
    <div class="brand-sub">Centre d'aide</div>
  </div>
  <nav class="side-nav" aria-label="Nouveautés">
    <a class="retour" href="${base}../"><svg class="ico"><use href="#i-book"/></svg>Centre d'aide</a>
    <a class="tout${courante ? '' : ' active'}" href="${base}"${courante ? '' : ' aria-current="page"'}><svg class="ico"><use href="#i-sparkles"/></svg>Toutes les nouveautés</a>
    <div class="side-group">Notes de version</div>
    <div class="notes">
      ${liens}
    </div>
  </nav>
  <div class="side-foot">Leo RH <span>by Neva</span></div>
</aside>
<div class="main">
  <div class="topbar">
    <h2><a href="${base}../">Centre d'aide</a> <span>›</span> ${courante ? `<a href="${base}">Nouveautés</a> <span>›</span> ${dateLongue(courante)}` : 'Nouveautés'}</h2>
  </div>
  <div class="wrap">
${contenu}
  </div>
</div>
<footer class="doc">
  <div>Centre d'aide — <strong>Leo RH</strong> · Nouveautés</div>
  <div>Leo RH <strong>by Neva</strong></div>
</footer>
</body>
</html>
`;
}

const pastilles = (n) => n.modules.length ? `<div class="modules">${n.modules.map((m) => `<span>${echapper(m)}</span>`).join('')}</div>` : '';

// Liste : la plus récente en tête.
const liste = page({
  titre: 'Nouveautés — Centre d\'aide Leo RH',
  description: 'Les nouveautés de Leo RH, de la plus récente à la plus ancienne.',
  base: '',
  courante: null,
  canonique: `${SITE}/nouveautes/`,
  contenu: `    <div class="hero">
      <div class="sur-titre"><svg class="ico"><use href="#i-sparkles"/></svg>Nouveautés</div>
      <h1>Ce qui change dans Leo RH</h1>
      <p>Chaque mise en production, ce qu'elle apporte et où le trouver. La plus récente en tête.</p>
    </div>
    <ol class="releases">
${notes.map((n, i) => `      <li>
        <a class="release" href="${n.date}/">
          <time datetime="${n.date}">${dateLongue(n.date)}</time>
          <div class="corps">
            <h2>${echapper(n.titre)}${i === 0 ? ' <span class="nouveau">Dernière</span>' : ''}</h2>
            <p>${echapper(n.resume)}</p>
            ${pastilles(n)}
          </div>
          <svg class="fleche" aria-hidden="true"><use href="#i-arrow-right"/></svg>
        </a>
      </li>`).join('\n')}
    </ol>`,
});

// Une page par note, avec la précédente et la suivante.
for (const d of readdirSync(DOSSIER)) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) rmSync(join(DOSSIER, d), { recursive: true });
}
notes.forEach((n, i) => {
  const plusRecente = notes[i - 1], plusAncienne = notes[i + 1];
  const html = page({
    titre: `${n.titre} — Nouveautés Leo RH`,
    description: n.resume,
    base: '../',
    courante: n.date,
    canonique: `${SITE}/nouveautes/${n.date}/`,
    contenu: `    <article class="note">
      <a class="toutes" href="../"><svg class="ico"><use href="#i-arrow-left"/></svg>Toutes les nouveautés</a>
      <time datetime="${n.date}">${dateLongue(n.date)}${i === 0 ? ' <span class="nouveau">Dernière</span>' : ''}</time>
      <h1>${echapper(n.titre)}</h1>
      <p class="lead">${echapper(n.resume)}</p>
      ${pastilles(n)}
      <div class="contenu">
${n.html}
      </div>
    </article>
    <nav class="voisines" aria-label="Autres notes de version">
      ${plusAncienne ? `<a class="prec" href="../${plusAncienne.date}/"><span>Précédente · ${dateCourte(plusAncienne.date)}</span>${echapper(plusAncienne.titre)}</a>` : '<span></span>'}
      ${plusRecente ? `<a class="suiv" href="../${plusRecente.date}/"><span>Suivante · ${dateCourte(plusRecente.date)}</span>${echapper(plusRecente.titre)}</a>` : '<span></span>'}
    </nav>`,
  });
  mkdirSync(join(DOSSIER, n.date), { recursive: true });
  writeFileSync(join(DOSSIER, n.date, 'index.html'), html);
});
writeFileSync(join(DOSSIER, 'index.html'), liste);

// Lu par l'application : la première entrée est la dernière nouveauté.
writeFileSync(join(DOSSIER, 'releases.json'), JSON.stringify({
  releases: notes.map((n) => ({
    date: n.date, titre: n.titre, resume: n.resume, modules: n.modules,
    url: `${SITE}/nouveautes/${n.date}/`,
  })),
}, null, 2) + '\n');

// index.html : lien de la barre latérale et bandeau de la dernière nouveauté.
const derniere = notes[0];
const remplacer = (texte, nom, contenu) => {
  const re = new RegExp(`(<!-- nouveautes:${nom} -->)[\\s\\S]*?(<!-- /nouveautes:${nom} -->)`);
  if (!re.test(texte)) throw new Error(`index.html : marqueurs <!-- nouveautes:${nom} --> introuvables`);
  return texte.replace(re, `$1${contenu}$2`);
};
let maj = remplacer(accueil, 'lien',
  `<a class="side-news" href="nouveautes/"><svg class="ico"><use href="#i-sparkles"/></svg><span class="t">Nouveautés</span><span class="d">${dateCourte(derniere.date)}</span></a>`);
maj = remplacer(maj, 'bandeau',
  `<a class="bandeau-nouveaute" href="nouveautes/${derniere.date}/"><span class="pastille">Nouveau · ${dateCourte(derniere.date)}</span><span class="t">${echapper(derniere.titre)}</span><span class="voir">Voir les nouveautés →</span></a>`);
if (maj !== accueil) writeFileSync(join(RACINE, 'index.html'), maj);

console.log(`${notes.length} notes publiées, la dernière : ${derniere.date} « ${derniere.titre} »`);
if (!existsSync(join(DOSSIER, 'style.css'))) console.warn('Attention : nouveautes/style.css manquant');
