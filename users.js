// Liste des utilisateurs autorisés
// Pour ajouter un utilisateur : ajouter une ligne { login, password, prenom }
// Ne jamais committer ce fichier avec de vrais mots de passe en production

const USERS = [
  { login: 'admin', password: 'clartee2026', prenom: 'Admin' },
  { login: 'democlar2026', password: 'demo2026tee', prenom: 'Testeur' },
];

module.exports = USERS;
