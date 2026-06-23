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
    if ((m = line.match(/^(QUESTION|REPONSE_OK|REPONSE_KO|FEEDBACK_OK|FEEDBACK_KO|PAIRES)\s*=\s*(.+)$/i))) {
      if (current) {
        const key = m[1].toUpperCase();
        if (key === 'REPONSE_KO') current[key] = cleanVal(m[2]).split('|').map(s => cleanVal(s)).filter(Boolean);
        else if (key === 'PAIRES') {
          // "Libellé:valeur | Libellé:valeur | ..."
          current.PAIRES = cleanVal(m[2]).split('|').map(p => {
            const idx = p.indexOf(':');
            if (idx === -1) return null;
            return { label: p.slice(0, idx).trim(), value: p.slice(idx + 1).trim() };
          }).filter(Boolean);
        }
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

// Renvoie { label, url } propres pour une source : libellé nettoyé du markdown, URL séparée.
function sourceInfo(kb, code) {
  const s = kb.sources[code];
  if (!s) return { label: code, url: null };
  let label = s.libelle || code;
  // Retirer les liens markdown [texte](url) en gardant le texte
  label = label.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Retirer les URLs nues résiduelles
  label = label.replace(/https?:\/\/[^\s)]+/g, '').replace(/\s{2,}/g, ' ').replace(/[\s,.]+$/, '').trim();
  // Retirer astérisques markdown et guillemets typographiques superflus en bord
  label = label.replace(/\*+/g, '').replace(/^["“”']+|["“”']+$/g, '').replace(/[\s,.*]+$/, '').trim();
  return { label, url: s.url || null };
}

// Construit un artefact DRAGDROP déterministe à partir de paires imposées, pour une "partie" donnée.
// Découpe en groupes de 3. Renvoie { json, totalParts }.
function buildDragDropPart(pairs, part, src, groupSize) {
  const size = groupSize || 3;
  const totalParts = Math.ceil(pairs.length / size);
  const slice = pairs.slice(part * size, part * size + size);
  const items = slice.map(p => p.value);
  const targets = slice.map(p => p.label);
  const solution = {};
  slice.forEach(p => { solution[p.value] = p.label; });
  const suffix = totalParts > 1 ? ` (partie ${part + 1}/${totalParts})` : '';
  const json = {
    type: 'dragdrop',
    instruction: `Associez chaque quantité d'eau au bon produit, puis validez.${suffix}`,
    items, targets, solution,
    explanation: `Ces valeurs sont des moyennes sur la production mondiale, à comparer à une douche de 5 minutes (100 litres).`,
    source: src && src.label ? src.label : '',
    sourceUrl: src && src.url ? src.url : ''
  };
  return { json, totalParts };
}

function getMomentInstruction(kb, script, index, action) {
  const m = script.moments[index];
  if (!m) return null;
  const total = script.moments.length;
  const isLast = index === total - 1;

  // Contexte commun, compact
  let instr = `Tu joues UNIQUEMENT le moment ${index + 1} sur ${total} du module "${kb.titre}" (${kb.module}). Tu ne joues PAS les autres moments. Tu produis exactement UN message (texte OU un seul artefact JSON), puis tu t'arrêtes.\n\n`;

  if (m.type === 'INTRO_MODULE') {
    const seqLines = Object.entries(kb.sequences).map(([n, t]) => `${n}. ${t}`).join('\n');
    instr += `MOMENT : INTRO_MODULE.\n`;
    instr += `Produis un message texte d'accueil ainsi structuré (et UNIQUEMENT du texte, pas d'artefact JSON) :\n`;
    instr += `1) Une ou deux phrases d'accroche présentant le sujet du module "${kb.titre}".\n`;
    instr += `2) La phrase "Ce module se compose de ${Object.keys(kb.sequences).length} séquences :"\n`;
    instr += `3) La liste numérotée EXACTE des séquences, chacune sur sa propre ligne, recopiée telle quelle :\n${seqLines}\n`;
    instr += `4) Une dernière ligne invitant à appuyer sur « Continuer ».\n`;
    instr += `IMPORTANT : conserve la liste numérotée visible (1., 2., 3.), ne la fonds pas dans une phrase. N'évalue rien.`;
    return instr;
  }

  if (m.type === 'INTRO_SEQUENCE') {
    const titre = kb.sequences[m.sequence] || '';
    instr += `MOMENT : INTRO_SEQUENCE_${m.sequence}.\nProduis UNE seule phrase de transition naturelle qui introduit la séquence "${titre}", par exemple "Passons maintenant à : ${titre}." ou "Découvrons à présent ${titre}." Court, chaleureux, en texte simple. N'annonce pas de numéro de séquence. Pas d'artefact, pas d'évaluation, pas d'invitation à appuyer sur un bouton.`;
    return instr;
  }

  if (m.type === 'SYNTHESE') {
    // Fournir explicitement les notions réellement vues, pour interdire toute invention
    const points = kb.notions.map(nn => `- ${nn.texte}`).join('\n');
    instr += `MOMENT : SYNTHESE (dernier moment du module).\n`;
    instr += `Voici les notions RÉELLEMENT abordées dans ce module (et UNIQUEMENT celles-ci) :\n${points}\n\n`;
    instr += `Produis un récapitulatif au format markdown à puces (une puce "- " par point clé, 3 à 5 puces). Chaque puce résume FIDÈLEMENT l'une des notions ci-dessus.\n`;
    instr += `INTERDICTION ABSOLUE : n'ajoute AUCUNE information, solution, recommandation, cause ou conséquence qui ne figure pas explicitement dans les notions ci-dessus. Pas de "solutions existent", pas de "gestion durable", pas d'"inégalités sociales" si ce n'est pas dans les notions.\n`;
    instr += `Commence par une courte phrase d'introduction (ex: "Récapitulons les points clés de ce module :"). Puis les puces.\n`;
    instr += `Termine sur une dernière ligne, exactement : [[KIT:${kb.media || 'kit.png'}]]\n`;
    instr += `Ne dis pas "Continuer" (c'est la fin). Pas de double conclusion. Pas d'artefact JSON.`;
    return instr;
  }

  // TRANSMETTRE ou EVALUER : il faut la notion
  const n = findNotion(kb, m.notion);
  if (!n) { instr += `MOMENT : ${m.type} notion ${m.notion} (notion introuvable, produis un court texte d'erreur neutre).`; return instr; }

  const src = sourceInfo(kb, n.source);
  const srcLabel = src.label;
  const srcUrl = src.url || '';
  const hasP2 = !!n.complement;

  if (m.type === 'TRANSMETTRE') {
    const type = m.artefactValide ? m.artefact : 'TEXTE';
    const wantsMore = /savoir plus/i.test(action || '');

    // Cas "En savoir plus" : on affiche le complément P2 dans un TEXTE, puis seulement "Continuer".
    if (wantsMore && hasP2) {
      const cSrc = sourceInfo(kb, n.complementSource || n.source);
      instr += `MOMENT : approfondissement de la notion ${n.id} (élément complémentaire).\n`;
      instr += `Tu produis UNIQUEMENT un artefact JSON TEXTE présentant cet élément complémentaire, fidèlement, sans le déformer :\n"${n.complement}"\n\n`;
      instr += `Le champ "more" doit être false (pas d'autre approfondissement).\n`;
      instr += `Produis : {"type":"texte","title":"Pour aller plus loin","text":"<le complément, fidèle>","source":"${cSrc.label}","sourceUrl":"${cSrc.url || ''}","more":false}`;
      return instr;
    }

    instr += `MOMENT : TRANSMETTRE notion ${n.id} via l'artefact ${type} (type imposé, ne change pas).\n`;
    instr += `Tu PRÉSENTES la notion sans l'évaluer. Tu produis UNIQUEMENT l'artefact JSON ${type} ci-dessous, rien d'autre.\n\n`;
    instr += `CONTENU EXACT DE LA NOTION (à ne pas déformer, reprends fidèlement les chiffres et le sens) :\n"${n.texte}"\n\n`;
    instr += `Source (champ "source" = libellé, champ "sourceUrl" = lien, à recopier tels quels) : "${srcLabel}" / "${srcUrl}"\n`;
    instr += `Le champ "more" DOIT valoir exactement ${hasP2} (ne change pas cette valeur, c'est imposé).\n`;
    if (type === 'VIGNETTE') {
      instr += `Média à afficher (champ "media") : "${n.media || ''}"\n`;
      instr += `Légende (champ "caption") : "${n.mediaLegende || ''}"\n`;
      instr += `\nProduis : {"type":"vignette","title":"<titre court de la notion>","text":"<le contenu de la notion, fidèle, reformulé clairement mais SANS changer les chiffres ni le sens>","media":"${n.media || ''}","caption":"${n.mediaLegende || ''}","source":"${srcLabel}","sourceUrl":"${srcUrl}","more":${hasP2}}`;
    } else {
      instr += `\nProduis : {"type":"texte","title":"<titre court de la notion>","text":"<le contenu de la notion, fidèle, SANS changer les chiffres ni le sens>","source":"${srcLabel}","sourceUrl":"${srcUrl}","more":${hasP2}}`;
    }
    return instr;
  }

  if (m.type === 'EVALUER') {
    const type = m.artefactValide ? m.artefact : 'QCM';
    instr += `MOMENT : EVALUER notion ${n.id} via l'artefact ${type} (type imposé, ne change pas).\n`;
    instr += `Tu ÉVALUES l'apprenant. Tu produis UNIQUEMENT l'artefact JSON ${type}, rien d'autre.\n\n`;
    instr += `CONTENU DE RÉFÉRENCE DE LA NOTION (utilise EXACTEMENT ces données, ne les déforme pas, n'en invente aucune autre) :\n"${n.texte}"\n\n`;
    if (m.QUESTION) instr += `QUESTION imposée (utilise-la telle quelle) : "${m.QUESTION}"\n`;
    if (m.REPONSE_OK) instr += `BONNE réponse imposée : "${m.REPONSE_OK}"\n`;
    if (m.REPONSE_KO && m.REPONSE_KO.length) instr += `MAUVAISES réponses imposées : ${JSON.stringify(m.REPONSE_KO)}\n`;
    if (m.FEEDBACK_OK) instr += `Feedback si correct : "${m.FEEDBACK_OK}"\n`;
    if (m.FEEDBACK_KO) instr += `Feedback si incorrect : "${m.FEEDBACK_KO}"\n`;
    instr += `\nRÈGLE D'EXPLICATION : le champ "explanation" reformule clairement la bonne réponse de façon pédagogique, en UNE à DEUX phrases. NE CITE PAS la source dans "explanation" (elle est affichée à part via "source"/"sourceUrl"). N'écris jamais de formule vague comme "selon les données fournies".\n`;
    instr += `Source (champ "source" = libellé, champ "sourceUrl" = lien) : "${srcLabel}" / "${srcUrl}"\n\n`;
    if (type === 'QCM') {
      instr += `Produis un QCM. Place la bonne réponse et les distracteurs dans "options" (mélangés), "correct" = index de la bonne réponse.\n`;
      instr += `{"type":"qcm","question":"...","options":["A. ...","B. ...","C. ..."],"correct":0,"explanation":"...","source":"${srcLabel}","sourceUrl":"${srcUrl}"}`;
    } else if (type === 'DRAGDROP') {
      instr += `Produis un DRAGDROP qui utilise EXACTEMENT les données de la notion ci-dessus (les vrais éléments et leurs valeurs réelles, JAMAIS des échelles inventées).\n`;
      instr += `Chaque zone (target) reçoit UNE seule étiquette. Le nombre d'items = nombre de targets. Si plus de 3 éléments, n'en prends que 3.\n`;
      instr += `{"type":"dragdrop","instruction":"Associez chaque élément à sa valeur, puis validez.","items":["..."],"targets":["..."],"solution":{"item":"target"},"explanation":"...","source":"${srcLabel}","sourceUrl":"${srcUrl}"}`;
    } else if (type === 'SCALE') {
      instr += `Produis un SCALE fidèle à la notion. "mode" = "valeurs" | "accord" | "dates". "labels" = repères des extrémités. "correct" = index attendu (null en mode accord).\n`;
      instr += `{"type":"scale","mode":"valeurs","question":"...","options":["..."],"labels":["...","..."],"correct":2,"explanation":"...","source":"${srcLabel}","sourceUrl":"${srcUrl}"}`;
    } else {
      instr += `Produis un QCM.\n{"type":"qcm","question":"...","options":["A. ...","B. ...","C. ..."],"correct":0,"explanation":"...","source":"${srcLabel}","sourceUrl":"${srcUrl}"}`;
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
  const instruction = getMomentInstruction(kb, script, index, action);
  const sys = BASE_RULES + `\n\n` + instruction;
  const userMsg = action && action.trim() ? action : 'Joue ce moment.';
  return [{ role: 'system', content: sys }, { role: 'user', content: userMsg }];
}

// Détermine le prochain index selon le moment courant et l'action de l'apprenant.
// L'action "En savoir plus" NE fait PAS avancer (on reste sur le moment pour montrer le complément P2).
function nextIndex(script, index, action) {
  const a = (action || '').toLowerCase();
  if (a.includes('savoir plus')) return index; // reste sur le moment (affiche le complément P2)
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
  const isNextPart = /partie suivante/i.test(action);

  // Détermine quel moment jouer.
  let playIndex;
  if (isStart) {
    playIndex = 0;
  } else if (isNextPart) {
    playIndex = index; // on reste sur le même moment (dragdrop multi-parties)
  } else {
    playIndex = nextIndex(script, index, action);
  }

  // Fin du module ?
  if (playIndex >= script.moments.length) {
    res.status(200).json({ content: [{ text: '' }], index: playIndex, total: script.moments.length, done: true });
    return;
  }

  const moment = script.moments[playIndex];

  // Cas spécial : EVALUER DRAGDROP avec PAIRES imposées => généré par le moteur (déterministe, fidèle KB), découpé en parties.
  if (moment.type === 'EVALUER' && moment.artefact === 'DRAGDROP' && Array.isArray(moment.PAIRES) && moment.PAIRES.length) {
    const n = findNotion(kb, moment.notion);
    const src = n ? sourceInfo(kb, n.source) : { label: '', url: '' };
    const part = Number.isInteger(body.ddPart) ? body.ddPart : 0;
    const { json, totalParts } = buildDragDropPart(moment.PAIRES, part, src, 3);
    res.status(200).json({
      content: [{ text: JSON.stringify(json) }],
      index: playIndex,
      total: script.moments.length,
      momentType: moment.type,
      ddPart: part,
      ddTotalParts: totalParts,
      hasMorePart: part < totalParts - 1,
      isLast: playIndex === script.moments.length - 1,
      done: false
    });
    return;
  }

  const messages = buildMomentMessages(kb, script, playIndex, action);
  try {
    const text = await mistralRequest(messages);
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
