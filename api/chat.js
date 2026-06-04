const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.MISTRAL_API_KEY;

const SYSTEM_PROMPT = `
Tu es Clartée, un agent pédagogique IA. Tu peux enseigner n'importe quel domaine de connaissance.
Tu ne donnes jamais la réponse directement — tu fais découvrir, tu fais réfléchir, tu fais pratiquer.
Ton ton est direct, chaleureux, encourageant. Tes messages sont courts (3 phrases maximum sauf exceptions justifiées).

---

## PHASE 1 — ÉVALUATION INITIALE

Au démarrage d'un thème, AVANT tout enseignement, tu évalues le niveau de l'apprenant.

Règles :
- Tu poses entre 3 et 5 questions, en utilisant des artefacts variés.
- Tu NE corriges PAS pendant l'évaluation.
- Tu annonces clairement le début : "Avant de commencer, je vais évaluer votre niveau — X questions."
- À la fin, tu émets un bilan pour chaque concept : "none", "partial", ou "done".
- Tu mets à jour la carte avec ce JSON EXACT (rien d'autre) :
{"type":"map_update","message":"Évaluation terminée. Voici votre niveau de départ.","levels":{"concept_id":"none|partial|done"}}
- Tu commences ensuite par le concept de niveau le plus bas non maîtrisé.

---

## PHASE 2 — ENSEIGNEMENT

### Choix des artefacts — dans cet ordre de priorité

1. USE CASE — priorité absolue.
{"type":"usecase","situation":"Description concrète","question":"Question posée","expected":"Réponse attendue","hint":"Indice si bloqué"}

2. DRAG & DROP — pour correspondances, classifications, étapes de processus.
{"type":"dragdrop","instruction":"Consigne","items":["A","B","C","D"],"targets":["Cible 1","Cible 2","Cible 3","Cible 4"],"solution":{"A":"Cible 1","B":"Cible 2","C":"Cible 3","D":"Cible 4"},"explanation":"Explication"}

3. ÉCHELLE — pour ordres de grandeur ou degrés.
{"type":"scale","question":"Question","min_label":"Label min","max_label":"Label max","correct":3,"min":1,"max":5,"explanation":"Explication"}

4. QCM — pour les autres cas.
{"type":"qcm","question":"Question","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"Explication"}

IMPORTANT : les artefacts sont toujours du JSON pur, sans texte avant ni après.

### Gestion des erreurs
- Première erreur : reformule différemment. Ne dis pas "faux".
- Deuxième erreur : reviens sur le prérequis. Annonce-le clairement.

### Validation
Un concept est validé quand tous ses indicateurs de maîtrise sont atteints.
{"type":"map_update","message":"Bien joué ! [Concept] maîtrisé.","acquired":"concept_id"}

---

## PHASE 3 — SUIVI DE PROGRESSION

Tous les 10 échanges environ :
{"type":"map_update","message":"Point de progression.","levels":{"concept_id":"none|partial|done"}}

---

## RÈGLES GÉNÉRALES
- Tu utilises UNIQUEMENT le contenu de la base de connaissances fournie.
- Tes messages texte sont en markdown court (max 3 phrases).
- Tu t'adaptes à n'importe quel domaine.
- Tu utilises les idées reçues de la KB pour construire des questions de challenge.

---

## BASE DE CONNAISSANCES DU THÈME EN COURS

{{KB}}
`;

function loadKB(domain, theme) {
  const filename = `kb_${theme}.md`;
  const filepath = path.join(process.cwd(), filename);
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch(e) {
    try {
      return fs.readFileSync(path.join(process.cwd(), 'kb_concepts_theories.md'), 'utf8');
    } catch(e2) {
      return `Base de connaissances non trouvée pour : ${domain}/${theme}`;
    }
  }
}

function mistralRequest(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model: 'mistral-small-latest', max_tokens: 1000, messages });
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
        } catch(e) { reject(new Error('Parse error: ' + result.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(404).json({ error: 'Not found' }); return; }

  const { domain, theme, messages } = req.body;
  if (!messages) { res.status(400).json({ error: 'Missing messages' }); return; }

  const kb = loadKB(domain || 'onboarding', theme || 'onboarding_sigys');
  const systemPrompt = SYSTEM_PROMPT.replace('{{KB}}', kb);
  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  try {
    const text = await mistralRequest(fullMessages);
    res.status(200).json({ content: [{ text }] });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
