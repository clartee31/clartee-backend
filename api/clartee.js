// ════════════════════════════════════════════════════════════════════
//  CLARTÉE — MOTEUR PÉDAGOGIQUE (clartee.js)
//  Le COMMENT : IP Clartée, moteur générique stable.
//  Charge kb-{code}.md + script-{code}.md, assemble le prompt système,
//  impose strictement les 5 artefacts validés. Backend Vercel + Mistral.
// ════════════════════════════════════════════════════════════════════

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.MISTRAL_API_KEY;
const ARTEFACTS = ['QCM', 'VIGNETTE', 'TEXTE', 'DRAGDROP', 'SCALE'];

// ─────────────────────────────────────────────────────────────────────
//  PARSER KB  (validé sur fichiers réels K11)
// ─────────────────────────────────────────────────────────────────────
function parseKB(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
  const lines = text.split('\n');
  const kb = {
    module: null, titre: null, media: null, mediaLegende: null, miseAJour: null,
    sequences: {}, notions: [], sources: {}, _lastSource: null
  };
  let currentSection = null, currentSeq = null, currentNotion = null, captureComplement = false;

  const mediaRe = /^Média\s*=\s*([^\s(]+)\s*(?:\(légende\s*:\s*(.+?)\))?\s*$/i;
  const notionRe = /^\*\*\*Notion\s+([\d.]+)\s*\(Source\s+(S\d+)\)/i;
  const complementRe = /^Élément complémentaire\s*\(Source\s+(S\d+)\)/i;
  const sourceRe = /^(S\d+)\s*:\s*(.+)$/;
  const seqRe = /^Séquence\s+(\d+)\s*=\s*(.+)$/i;
  const sepRe = /^[—–\-]{3,}$/;

  function pushNotion() { if (currentNotion) { kb.notions.push(currentNotion); currentNotion = null; } }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (sepRe.test(line)) { pushNotion(); captureComplement = false; continue; }

    let m;
    if ((m = line.match(/^Module\s+(\w+)/i))) { kb.module = m[1]; currentSection = 'module'; continue; }
    if ((m = line.match(/^Titre\s*=\s*(.+)$/i))) { kb.titre = m[1].trim(); continue; }
    if ((m = line.match(/^Mise à jour\s*=\s*(.+)$/i))) { kb.miseAJour = m[1].trim(); continue; }
    if ((m = line.match(seqRe))) { kb.sequences[m[1]] = m[2].trim(); continue; }
    if ((m = line.match(/^Notions de la séquence\s+(\d+)/i))) { pushNotion(); currentSeq = m[1]; currentSection = 'notions'; captureComplement = false; continue; }
    if (/^Sources référencées/i.test(line)) { pushNotion(); currentSection = 'sources'; continue; }

    if (currentSection === 'sources') {
      if ((m = line.match(sourceRe))) {
        const urlMatch = line.match(/\*(https?:\/\/[^\s*]+)\*/) || line.match(/(https?:\/\/[^\s*)]+)/);
        kb._lastSource = m[1];
        kb.sources[m[1]] = { libelle: m[2].replace(/\*?https?:\/\/[^\s*]+\*?/, '').replace(/\s+$/, '').replace(/,\s*$/, '').trim(), url: urlMatch ? urlMatch[1] : null };
      } else if (kb._lastSource && kb.sources[kb._lastSource] && !kb.sources[kb._lastSource].url) {
        const urlMatch = line.match(/(https?:\/\/[^\s*)]+)/);
        if (urlMatch) kb.sources[kb._lastSource].url = urlMatch[1];
      }
      continue;
    }

    if ((m = line.match(mediaRe))) {
      if (currentNotion) { currentNotion.media = m[1]; currentNotion.mediaLegende = m[2] || null; }
      else { kb.media = m[1]; kb.mediaLegende = m[2] || null; }
      continue;
    }
    if ((m = line.match(notionRe))) {
      pushNotion();
      currentNotion = { id: m[1], sequence: currentSeq, source: m[2], texte: '', media: null, mediaLegende: null, complement: null, complementSource: null };
      captureComplement = false; continue;
    }
    if ((m = line.match(complementRe))) {
      if (currentNotion) { currentNotion.complementSource = m[1]; currentNotion.complement = ''; captureComplement = true; }
      continue;
    }
    if (currentNotion) {
      if (captureComplement) currentNotion.complement += (currentNotion.complement ? ' ' : '') + line;
      else currentNotion.texte += (currentNotion.texte ? ' ' : '') + line.replace(/^Message clé\s*:\s*/i, '');
    }
  }
  pushNotion();
  delete kb._lastSource;
  return kb;
}

// ─────────────────────────────────────────────────────────────────────
//  PARSER SCRIPT  (validé sur fichiers réels K11)
// ─────────────────────────────────────────────────────────────────────
function parseScript(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
  const lines = text.split('\n');
  const script = { module: null, miseAJour: null, moments: [] };
  let current = null;
  const cleanVal = v => v.trim().replace(/^["«»“”]+/, '').replace(/["«»“”]+$/, '').trim();
  function pushMoment(m) { script.moments.push(m); current = m; }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let m;
    if ((m = line.match(/^Script Module\s+(\w+)/i))) { script.module = m[1]; continue; }
    if (/Clartée copyright/i.test(line)) continue;
    if ((m = line.match(/^Mise à jour\s*=\s*(.+)$/i))) { script.miseAJour = m[1].trim(); continue; }
    if (/^INTRO_MODULE$/i.test(line)) { pushMoment({ type: 'INTRO_MODULE' }); continue; }
    if ((m = line.match(/^INTRO_SEQUENCE_(\d+)$/i))) { pushMoment({ type: 'INTRO_SEQUENCE', sequence: m[1] }); continue; }
    if (/^SYNTHESE$/i.test(line)) { pushMoment({ type: 'SYNTHESE' }); continue; }
    if ((m = line.match(/^TRANSMETTRE_notion([\d.]+)_(\w+)$/i))) {
      const a = m[2].toUpperCase(); pushMoment({ type: 'TRANSMETTRE', notion: m[1], artefact: a, artefactValide: ARTEFACTS.includes(a) }); continue;
    }
    if ((m = line.match(/^EVALUER_notion([\d.]+)_(\w+)$/i))) {
      const a = m[2].toUpperCase(); pushMoment({ type: 'EVALUER', notion: m[1], artefact: a, artefactValide: ARTEFACTS.includes(a) }); continue;
    }
    if ((m = line.match(/^(QUESTION|REPONSE_OK|REPONSE_KO|FEEDBACK_OK|FEEDBACK_KO)\s*=\s*(.+)$/i))) {
      if (current) {
        const key = m[1].toUpperCase();
        if (key === 'REPONSE_KO') current[key] = cleanVal(m[2]).split('|').map(s => cleanVal(s)).filter(Boolean);
        else current[key] = cleanVal(m[2]);
      }
      continue;
    }
  }
  return script;
}

// ─────────────────────────────────────────────────────────────────────
//  CHARGEMENT PAR CODE MODULE
// ─────────────────────────────────────────────────────────────────────
function loadModule(code) {
  const c = (code || 'k11').toLowerCase();
  const read = p => fs.readFileSync(p, 'utf8');
  const root = process.cwd();
  // Ordre de recherche : _data/ (non servi par Vercel, IP protégée) > api/ > racine
  const candidates = name => [
    path.join(root, '_data', name),
    path.join(root, 'api', '_data', name),
    path.join(root, 'api', name),
    path.join(root, name)
  ];
  function readFirst(name) {
    for (const p of candidates(name)) {
      try { return read(p); } catch (e) { /* essai suivant */ }
    }
    throw new Error('Fichier introuvable : ' + name);
  }
  const kbRaw = readFirst(`kb-${c}.md`);
  const scRaw = readFirst(`script-${c}.md`);
  return { kb: parseKB(kbRaw), script: parseScript(scRaw) };
}

// ─────────────────────────────────────────────────────────────────────
//  SÉRIALISATION KB + SCRIPT POUR LE PROMPT
// ─────────────────────────────────────────────────────────────────────
function kbToText(kb) {
  let s = `MODULE ${kb.module} — ${kb.titre}\n`;
  s += `Média KIT : ${kb.media || '(aucun)'}${kb.mediaLegende ? ' (légende : ' + kb.mediaLegende + ')' : ''}\n\n`;
  s += `SÉQUENCES :\n`;
  Object.entries(kb.sequences).forEach(([n, t]) => { s += `  Séquence ${n} : ${t}\n`; });
  s += `\nNOTIONS :\n`;
  kb.notions.forEach(n => {
    s += `\n[Notion ${n.id}] (séquence ${n.sequence}, source ${n.source})\n`;
    s += `  Texte (priorité 1) : ${n.texte}\n`;
    s += `  Média : ${n.media || '(aucun)'}${n.mediaLegende ? ' (légende : ' + n.mediaLegende + ')' : ''}\n`;
    if (n.complement) s += `  Élément complémentaire (priorité 2, source ${n.complementSource}) : ${n.complement}\n`;
    else s += `  Élément complémentaire : (aucun — ne PAS afficher le bouton « En savoir plus »)\n`;
  });
  s += `\nSOURCES :\n`;
  Object.entries(kb.sources).forEach(([id, src]) => { s += `  ${id} : ${src.libelle}${src.url ? ' — ' + src.url : ''}\n`; });
  return s;
}

function scriptToText(script) {
  let s = `SCRIPT DU MODULE ${script.module} — séquence de ${script.moments.length} moments à exécuter DANS L'ORDRE :\n\n`;
  script.moments.forEach((m, i) => {
    const n = String(i + 1).padStart(2, '0');
    if (m.type === 'INTRO_MODULE') s += `${n}. INTRO_MODULE\n`;
    else if (m.type === 'INTRO_SEQUENCE') s += `${n}. INTRO_SEQUENCE_${m.sequence}\n`;
    else if (m.type === 'SYNTHESE') s += `${n}. SYNTHESE\n`;
    else {
      s += `${n}. ${m.type}_notion${m.notion}_${m.artefact}`;
      if (!m.artefactValide) s += `  [⚠ TYPE INCONNU — utiliser TEXTE par défaut]`;
      s += `\n`;
      if (m.QUESTION) s += `      QUESTION imposée : ${m.QUESTION}\n`;
      if (m.REPONSE_OK) s += `      REPONSE_OK imposée : ${m.REPONSE_OK}\n`;
      if (m.REPONSE_KO) s += `      REPONSE_KO imposées : ${JSON.stringify(m.REPONSE_KO)}\n`;
      if (m.FEEDBACK_OK) s += `      FEEDBACK_OK imposé : ${m.FEEDBACK_OK}\n`;
      if (m.FEEDBACK_KO) s += `      FEEDBACK_KO imposé : ${m.FEEDBACK_KO}\n`;
    }
  });
  return s;
}

// ─────────────────────────────────────────────────────────────────────
//  PROMPT SYSTÈME — l'IP Clartée (règles + 5 artefacts validés)
// ─────────────────────────────────────────────────────────────────────
function buildSystemPrompt(kb, script) {
  return `Tu es Clartée, agent pédagogique IA souverain. Tu fais découvrir, comprendre et ancrer une connaissance, étape par étape.

RÈGLE D'OR : tu suis le SCRIPT à la lettre, dans l'ordre, un moment à la fois. Tu n'inventes aucun contenu factuel : tout vient de la BASE DE CONNAISSANCES (KB). Le SCRIPT dit QUOI faire et QUAND ; la KB dit le contenu ; toi tu produis la forme.

CONTRAINTE ABSOLUE SUR LES ARTEFACTS : le type d'artefact est STRICTEMENT imposé par le script (le suffixe _QCM, _VIGNETTE, _TEXTE, _DRAGDROP, _SCALE). Tu n'en changes JAMAIS. Si un type est marqué inconnu, utilise TEXTE.

FORMAT DE SORTIE : chaque message est SOIT du texte court (2-3 phrases, markdown simple) SOIT un artefact JSON pur (rien avant, rien après). Jamais les deux dans le même message.

TYPOGRAPHIE : n'utilise JAMAIS le tiret cadratin. Utilise une virgule, deux-points ou parenthèses.

═══ LES 5 ARTEFACTS (modèles JSON EXACTS) ═══

1) QCM — évaluation à choix unique. Si QUESTION/REPONSE_OK/REPONSE_KO sont imposés dans le script, tu les utilises tels quels (la bonne réponse + les distracteurs, mélangés). "correct" est l'index de la bonne réponse.
{"type":"qcm","question":"...","options":["A. ...","B. ...","C. ..."],"correct":0,"explanation":"..."}

2) VIGNETTE — transmission avec média. Média en haut, titre, texte court de la notion, légende avec la source en clair. "more":true UNIQUEMENT si la notion a un élément complémentaire.
{"type":"vignette","title":"...","text":"...","media":"k11-media12.png","caption":"...","source":"S01","more":true}

3) TEXTE — transmission sans média (notions conceptuelles). Titre + paragraphe + source. "more":true seulement si élément complémentaire.
{"type":"texte","title":"...","text":"...","source":"S08","more":true}

4) DRAGDROP — évaluation par correspondances. Étiquettes neutres, mélangées. "solution" associe chaque item à sa cible.
{"type":"dragdrop","instruction":"Glissez chaque étiquette sur la bonne zone, puis validez. ...","items":["20 %","70 %","12 %"],"targets":["Agriculture","Industrie","Ménages"],"solution":{"70 %":"Agriculture","20 %":"Industrie","12 %":"Ménages"},"explanation":"..."}

5) SCALE — évaluation sur une échelle graduée. "mode" vaut "valeurs", "accord" ou "dates". "labels" = repères des deux extrémités. "correct" = index attendu (null en mode accord, pas de bonne réponse).
{"type":"scale","mode":"valeurs","question":"...","options":["10 %","25 %","50 %","75 %","90 %"],"labels":["Peu","Quasi tout"],"correct":2,"explanation":"..."}

═══ EXÉCUTION DES MOMENTS ═══

INTRO_MODULE : message texte d'accueil présentant le sujet du module et annonçant les séquences. Termine en invitant à appuyer sur « Continuer ».

INTRO_SEQUENCE_N : une phrase de transition annonçant la séquence N. Enchaîne directement.

TRANSMETTRE_notionX.Y_TYPE : présente la notion X.Y via l'artefact imposé (en général VIGNETTE ou TEXTE), avec le média associé si VIGNETTE. Tu n'évalues pas. Boutons proposés par l'artefact : « Continuer », « Me réexpliquer », et « En savoir plus » UNIQUEMENT si la notion a un élément complémentaire (P2).
- « Me réexpliquer » : tu entres dans un court dialogue (texte) pour comprendre le blocage et reformuler autrement.
- « En savoir plus » : tu présentes l'élément complémentaire (P2), puis seulement « Continuer » et « Me réexpliquer ».

EVALUER_notionX.Y_TYPE : évalue via l'artefact imposé. Utilise QUESTION/REPONSE_OK/REPONSE_KO/FEEDBACK_OK/FEEDBACK_KO s'ils sont imposés ; sinon construis-les depuis la notion. Après le feedback de l'apprenant, reformule succinctement la notion (texte court) et affiche le média associé s'il existe, puis « Continuer » / « Me réexpliquer ».

SYNTHESE : récapitulatif des points clés du module, puis affichage du KIT (image png du module) téléchargeable.

═══ SCRIPT À EXÉCUTER ═══

${scriptToText(script)}

═══ BASE DE CONNAISSANCES ═══

${kbToText(kb)}`;
}

// ─────────────────────────────────────────────────────────────────────
//  PROMPT PARTAGER (capture de connaissance, jamais d'évaluation)
// ─────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT_PARTAGER = `Tu es Clartée, agent de capture de connaissance.
Ton rôle UNIQUE : aider la personne à structurer et formaliser une connaissance qu'elle veut partager.

RÈGLES ABSOLUES :
- Tu NE poses JAMAIS de questions d'évaluation. Jamais.
- Tu NE testes PAS le niveau de la personne.
- Tu poses des questions structurantes UNE PAR UNE pour comprendre ce qu'elle partage.
- N'utilise jamais le tiret cadratin (virgule, deux-points ou parenthèses à la place).

DÉROULEMENT :
1. La personne décrit ce qu'elle veut partager.
2. Tu poses des questions pour structurer : Contexte ? Observation précise ? Impact constaté ? Fréquence ? Qui est concerné ?
3. Tu reformules ce que tu as compris pour validation.
4. Tu proposes un titre court pour cette connaissance.
5. Tu confirmes que ce sera soumis au Knowledge Master pour validation.

Max 2 phrases par réponse. Une seule question à la fois.`;

// ─────────────────────────────────────────────────────────────────────
//  APPEL MISTRAL
// ─────────────────────────────────────────────────────────────────────
function mistralRequest(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model: 'mistral-small-latest', max_tokens: 1200, messages });
    const options = {
      hostname: 'api.mistral.ai', path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`, 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, res => {
      let result = '';
      res.on('data', chunk => { result += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(result);
          if (!parsed.choices?.[0]?.message) return reject(new Error('Unexpected response: ' + result.substring(0, 200)));
          resolve(parsed.choices[0].message.content);
        } catch (e) { reject(new Error('Parse error: ' + result.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────
//  HANDLER VERCEL
// ─────────────────────────────────────────────────────────────────────
async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(404).json({ error: 'Not found' }); return; }

  const { code, module: moduleCode, messages, mode } = req.body;
  if (!messages) { res.status(400).json({ error: 'Missing messages' }); return; }

  let systemPrompt;
  try {
    if (mode === 'partager') {
      systemPrompt = SYSTEM_PROMPT_PARTAGER;
    } else {
      const { kb, script } = loadModule(code || moduleCode || 'k11');
      systemPrompt = buildSystemPrompt(kb, script);
    }
  } catch (err) {
    res.status(500).json({ error: 'Chargement module : ' + err.message }); return;
  }

  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  try {
    const text = await mistralRequest(fullMessages);
    res.status(200).json({ content: [{ text }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = handler;
module.exports.parseKB = parseKB;
module.exports.parseScript = parseScript;
module.exports.loadModule = loadModule;
module.exports.buildSystemPrompt = buildSystemPrompt;
module.exports.kbToText = kbToText;
module.exports.scriptToText = scriptToText;
module.exports.ARTEFACTS = ARTEFACTS;
