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
//  RÉSOLUTION D'UN MOMENT : prépare les données exactes du moment courant
// ─────────────────────────────────────────────────────────────────────
function findNotion(kb, id) { return kb.notions.find(n => n.id === id) || null; }
function sourceLabel(kb, code) {
  const s = kb.sources[code];
  if (!s) return code;
  return s.libelle || code;
}

function getMomentInstruction(kb, script, index) {
  const m = script.moments[index];
  if (!m) return null;
  const total = script.moments.length;
  const isLast = index === total - 1;

  // Contexte commun, compact
  let instr = `Tu joues UNIQUEMENT le moment ${index + 1} sur ${total} du module "${kb.titre}" (${kb.module}). Tu ne joues PAS les autres moments. Tu produis exactement UN message (texte OU un seul artefact JSON), puis tu t'arrêtes.\n\n`;

  if (m.type === 'INTRO_MODULE') {
    const seqList = Object.entries(kb.sequences).map(([n, t]) => `${n}) ${t}`).join(', ');
    instr += `MOMENT : INTRO_MODULE.\nProduis un court message texte (2-3 phrases) d'accueil qui présente le sujet du module "${kb.titre}" et annonce les ${Object.keys(kb.sequences).length} séquences : ${seqList}. Termine en invitant à appuyer sur « Continuer ». N'évalue rien. Pas d'artefact JSON, juste du texte.`;
    return instr;
  }

  if (m.type === 'INTRO_SEQUENCE') {
    const titre = kb.sequences[m.sequence] || '';
    instr += `MOMENT : INTRO_SEQUENCE_${m.sequence}.\nProduis UNE seule phrase de transition annonçant la séquence ${m.sequence} : "${titre}". Court, en texte. Pas d'artefact, pas d'évaluation.`;
    return instr;
  }

  if (m.type === 'SYNTHESE') {
    instr += `MOMENT : SYNTHESE (dernier moment du module).\nProduis un court récapitulatif des points clés du module (3-5 puces maximum, en texte markdown). Puis indique sur une dernière ligne, exactement : [[KIT:${kb.media || 'kit.png'}]]\nNe répète pas une conclusion déjà faite. Ne dis pas "Continuer" (c'est la fin). Pas d'artefact JSON.`;
    return instr;
  }

  // TRANSMETTRE ou EVALUER : il faut la notion
  const n = findNotion(kb, m.notion);
  if (!n) { instr += `MOMENT : ${m.type} notion ${m.notion} (notion introuvable, produis un court texte d'erreur neutre).`; return instr; }

  const srcLabel = sourceLabel(kb, n.source);
  const hasP2 = !!n.complement;

  if (m.type === 'TRANSMETTRE') {
    const type = m.artefactValide ? m.artefact : 'TEXTE';
    instr += `MOMENT : TRANSMETTRE notion ${n.id} via l'artefact ${type} (type imposé, ne change pas).\n`;
    instr += `Tu PRÉSENTES la notion sans l'évaluer. Tu produis UNIQUEMENT l'artefact JSON ${type} ci-dessous, rien d'autre.\n\n`;
    instr += `CONTENU EXACT DE LA NOTION (à ne pas déformer, reprends fidèlement les chiffres et le sens) :\n"${n.texte}"\n\n`;
    instr += `Source à afficher en clair (champ "source") : "${srcLabel}"\n`;
    if (type === 'VIGNETTE') {
      instr += `Média à afficher (champ "media") : "${n.media || ''}"\n`;
      instr += `Légende (champ "caption") : "${n.mediaLegende || ''}"\n`;
      instr += `\nProduis : {"type":"vignette","title":"<titre court de la notion>","text":"<le contenu de la notion, fidèle, reformulé de façon claire mais SANS changer les chiffres ni le sens>","media":"${n.media || ''}","caption":"${n.mediaLegende || ''}","source":"${srcLabel}","more":${hasP2}}`;
    } else {
      instr += `\nProduis : {"type":"texte","title":"<titre court de la notion>","text":"<le contenu de la notion, fidèle, SANS changer les chiffres ni le sens>","source":"${srcLabel}","more":${hasP2}}`;
    }
    return instr;
  }

  if (m.type === 'EVALUER') {
    const type = m.artefactValide ? m.artefact : 'QCM';
    instr += `MOMENT : EVALUER notion ${n.id} via l'artefact ${type} (type imposé, ne change pas).\n`;
    instr += `Tu ÉVALUES l'apprenant. Tu produis UNIQUEMENT l'artefact JSON ${type}, rien d'autre.\n\n`;
    instr += `CONTENU DE RÉFÉRENCE DE LA NOTION (pour construire la question, sans déformer) :\n"${n.texte}"\n\n`;
    if (m.QUESTION) instr += `QUESTION imposée (utilise-la telle quelle) : "${m.QUESTION}"\n`;
    if (m.REPONSE_OK) instr += `BONNE réponse imposée : "${m.REPONSE_OK}"\n`;
    if (m.REPONSE_KO && m.REPONSE_KO.length) instr += `MAUVAISES réponses imposées : ${JSON.stringify(m.REPONSE_KO)}\n`;
    if (m.FEEDBACK_OK) instr += `Feedback si correct : "${m.FEEDBACK_OK}"\n`;
    if (m.FEEDBACK_KO) instr += `Feedback si incorrect : "${m.FEEDBACK_KO}"\n`;
    instr += `\n`;
    if (type === 'QCM') {
      instr += `Produis un QCM. Place la bonne réponse et les distracteurs dans "options" (mélangés), "correct" = index de la bonne réponse. "explanation" = le feedback.\n`;
      instr += `{"type":"qcm","question":"...","options":["A. ...","B. ...","C. ..."],"correct":0,"explanation":"..."}`;
    } else if (type === 'DRAGDROP') {
      instr += `Produis un DRAGDROP cohérent avec la notion. "items" = étiquettes, "targets" = zones, "solution" = associations correctes.\n`;
      instr += `{"type":"dragdrop","instruction":"Glissez chaque étiquette sur la bonne zone, puis validez. ...","items":["..."],"targets":["..."],"solution":{"...":"..."},"explanation":"..."}`;
    } else if (type === 'SCALE') {
      instr += `Produis un SCALE. "mode" = "valeurs" | "accord" | "dates". "labels" = repères des extrémités. "correct" = index attendu (null en mode accord).\n`;
      instr += `{"type":"scale","mode":"valeurs","question":"...","options":["..."],"labels":["...","..."],"correct":2,"explanation":"..."}`;
    } else { // VIGNETTE/TEXTE utilisés en évaluation : on retombe sur QCM par sécurité
      instr += `Produis un QCM.\n{"type":"qcm","question":"...","options":["A. ...","B. ...","C. ..."],"correct":0,"explanation":"..."}`;
    }
    return instr;
  }

  return instr;
}

// Petit prompt système commun, compact (l'IP de forme reste, mais le pilotage vient du moteur)
const BASE_RULES = `Tu es Clartée, agent pédagogique. Règles absolues :
- Tu produis EXACTEMENT un message : soit un court texte, soit UN artefact JSON pur (rien avant/après).
- Tu n'inventes aucun chiffre : tu reprends fidèlement le contenu fourni.
- Tu n'utilises JAMAIS le tiret cadratin (utilise virgule, deux-points, parenthèses).
- Tu ne joues que le moment demandé, puis tu t'arrêtes.
- LISIBILITÉ (messages texte uniquement) : termine chaque phrase par un retour à la ligne. Pour une liste (numérotée ou à puces), mets un retour à la ligne avant chaque élément, chaque élément sur sa propre ligne. Ces règles de mise en forme ne s'appliquent PAS au contenu d'un artefact JSON.`;

// Construit les messages pour Mistral pour un moment donné
function buildMomentMessages(kb, script, index, action) {
  const instruction = getMomentInstruction(kb, script, index);
  const sys = BASE_RULES + `\n\n` + instruction;
  const userMsg = action && action.trim() ? action : 'Joue ce moment.';
  return [{ role: 'system', content: sys }, { role: 'user', content: userMsg }];
}

// Détermine le prochain index selon le moment courant et l'action de l'apprenant.
// Les actions "Me réexpliquer" et "En savoir plus" NE font PAS avancer (on reste sur le moment).
function nextIndex(script, index, action) {
  const a = (action || '').toLowerCase();
  if (a.includes('réexpli') || a.includes('reexpli') || a.includes('savoir plus')) return index; // reste
  return Math.min(index + 1, script.moments.length); // avance (peut dépasser = fin)
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
//  HANDLER VERCEL — piloté moment par moment
// ─────────────────────────────────────────────────────────────────────
async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(404).json({ error: 'Not found' }); return; }

  // Parsing robuste du corps : Vercel peut livrer req.body en objet, en string, ou pas du tout.
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      if (typeof body === 'string' && body.length) {
        body = JSON.parse(body);
      } else {
        // Lire le flux brut si req.body n'est pas fourni
        const raw = await new Promise((resolve) => {
          let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); req.on('error', () => resolve(''));
        });
        body = raw ? JSON.parse(raw) : {};
      }
    } catch (e) { body = {}; }
  }

  const { code, module: moduleCode, mode } = body;

  // Mode "partager" : dialogue libre, inchangé
  if (mode === 'partager') {
    const messages = body.messages;
    if (!messages) { res.status(400).json({ error: 'Missing messages' }); return; }
    const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT_PARTAGER }, ...messages];
    try {
      const text = await mistralRequest(fullMessages);
      res.status(200).json({ content: [{ text }] });
    } catch (err) { res.status(500).json({ error: err.message }); }
    return;
  }

  // Mode "formation" : piloté par index de moment
  let kb, script;
  try {
    ({ kb, script } = loadModule(code || moduleCode || 'k11'));
  } catch (err) {
    res.status(500).json({ error: 'Chargement module : ' + err.message }); return;
  }

  // index courant (dernier moment joué), action de l'apprenant
  let index = Number.isInteger(body.index) ? body.index : 0;
  const action = body.action || '';
  const isStart = body.start === true || /d[ée]marrer/i.test(action);

  // Détermine quel moment jouer.
  // Démarrage => moment 0. Sinon, les actions "réexpliquer"/"savoir plus" restent sur le moment,
  // toute autre action (Continuer, Bonne réponse, etc.) avance d'un cran.
  let playIndex;
  if (isStart) {
    playIndex = 0;
  } else {
    playIndex = nextIndex(script, index, action);
  }

  // Fin du module ?
  if (playIndex >= script.moments.length) {
    res.status(200).json({ content: [{ text: '' }], index: playIndex, total: script.moments.length, done: true });
    return;
  }

  const messages = buildMomentMessages(kb, script, playIndex, action);
  try {
    const text = await mistralRequest(messages);
    const moment = script.moments[playIndex];
    res.status(200).json({
      content: [{ text }],
      index: playIndex,
      total: script.moments.length,
      momentType: moment.type,
      isLast: playIndex === script.moments.length - 1,
      done: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = handler;
module.exports.parseKB = parseKB;
module.exports.parseScript = parseScript;
module.exports.loadModule = loadModule;
module.exports.getMomentInstruction = getMomentInstruction;
module.exports.buildMomentMessages = buildMomentMessages;
module.exports.nextIndex = nextIndex;
module.exports.ARTEFACTS = ARTEFACTS;
