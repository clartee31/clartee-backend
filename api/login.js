const USERS = [
  { login: 'adminclar', password: 'clartee2026', prenom: 'Admin' },
  { login: 'democlar2026', password: 'demo2026tee', prenom: 'Testeur' },
];

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(404).json({ error: 'Not found' }); return; }

  const { login, password } = req.body;
  if (!login || !password) {
    res.status(400).json({ error: 'Login et mot de passe requis' });
    return;
  }

  const user = USERS.find(u => u.login === login.trim().toLowerCase() && u.password === password);
  if (!user) {
    res.status(401).json({ error: 'Identifiants incorrects' });
    return;
  }

  res.status(200).json({ success: true, prenom: user.prenom, login: user.login });
};
