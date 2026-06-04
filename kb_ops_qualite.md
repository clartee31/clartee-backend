# BASE DE CONNAISSANCES — SIGYS

- **Domaine :** Savoir-faire opérationnels
- **Thème :** Contrôle qualité
- **Dernière mise à jour :** Juin 2026

---

## COMPÉTENCE 1 — Les points de contrôle dans la production

- **Niveau de difficulté :** Débutant
- **Prérequis :** Les étapes de production, Ce que qualité signifie chez SIGYS

### Description
Le contrôle qualité chez SIGYS n'est pas une étape finale — c'est un fil conducteur tout au long de la production. Des points de contrôle sont définis à chaque étape clé pour détecter les défauts le plus tôt possible, avant qu'ils se propagent et se multiplient.

### Points clés
1. **Contrôle matières à réception** : humidité du bois, aspect des peintures, conformité des quincailleries.
2. **Contrôle après débit** : dimensions des pièces au réglet (±0,5 mm), absence de fissures ou nœuds problématiques.
3. **Contrôle après usinage** : vérification des profils, des trous, des ajustements d'emboîtement.
4. **Contrôle après ponçage** : uniformité de surface, absence de rayures profondes, arêtes arrondies.
5. **Contrôle final** : aspect peinture, solidité des assemblages, conformité aux normes de sécurité, test fonctionnel.

### Idées reçues
- **Idée reçue 1 :** "Le contrôle final suffit — pas besoin de contrôler pendant la production."
  → Réalité : Un défaut détecté au contrôle final peut signifier que 50 pièces sont déjà non conformes. Un contrôle intermédiaire stoppe le problème à 5 pièces.

- **Idée reçue 2 :** "Le contrôle c'est le rôle du contrôleur qualité, pas de l'opérateur."
  → Réalité : L'opérateur est le premier contrôleur — il est le mieux placé pour détecter une anomalie sur son poste. Le contrôleur qualité valide, il ne remplace pas l'autocontrôle.

- **Idée reçue 3 :** "On ne peut pas contrôler 100 % des pièces, c'est trop long."
  → Réalité : Sur certains contrôles rapides (aspect visuel, cote critique), le 100 % est possible et nécessaire. Sur les contrôles plus longs, SIGYS applique un contrôle par échantillonnage selon des règles définies.

### Chiffres clés
- 5 points de contrôle dans la chaîne de production
- Tolérance dimensionnelle : ±0,5 mm sur les cotes critiques
- Contrôle 100 % sur les cotes d'assemblage et le contrôle final
- Échantillonnage sur les contrôles visuels intermédiaires

### Exemples concrets

#### Exemple 1 — Le contrôle après débit
Un opérateur mesure les premières pièces débitées d'un lot de 100. La largeur est de 48,2 mm au lieu de 50 mm — la lame a dérivé. Il ajuste le réglage et reprend les 5 premières pièces. Sans ce contrôle au départ, les 100 pièces auraient été sous-dimensionnées.

#### Exemple 2 — Le contrôle final fonctionnel
Pour une boîte à formes, le contrôle final inclut le passage de chaque forme dans son emplacement correspondant. Une forme refuse de passer — elle est 0,4 mm trop large à cause d'un gonflement humidité. La pièce est reprise à la ponceuse. L'enfant ne le saura jamais — c'est l'objectif.

### Liens avec d'autres compétences
- **Standards qualité produit** : les critères de contrôle découlent directement des standards.
- **Signaler et traiter un problème qualité** : un défaut détecté à un point de contrôle déclenche le processus de signalement.

### Indicateurs de maîtrise
- [ ] L'apprenant peut citer les 5 points de contrôle dans l'ordre de la production.
- [ ] L'apprenant comprend pourquoi le contrôle intermédiaire est plus efficace que le contrôle final seul.
- [ ] L'apprenant effectue l'autocontrôle sur son poste sans qu'on le lui demande.
- [ ] L'apprenant sait distinguer ce qui se contrôle à 100 % de ce qui se contrôle par échantillonnage.

### Ressources externes
- Fiches de contrôle SIGYS par étape (documents internes) — disponibles auprès du responsable qualité.

### Artefact manuel
- **Type :** Image
- **Fichier :** sigys_points_controle.png
- **Description :** Carte des 5 points de contrôle dans la chaîne de production avec critères, outils de mesure et fréquences de contrôle.

---

## COMPÉTENCE 2 — Les défauts courants et leur traitement

- **Niveau de difficulté :** Intermédiaire
- **Prérequis :** Les points de contrôle, Standards qualité produit

### Description
Connaître les défauts courants chez SIGYS permet de les reconnaître rapidement, de les qualifier (éliminatoire ou acceptable) et de décider de l'action appropriée. La plupart des défauts ont une cause identifiable et une solution connue — l'expérience collective est documentée pour que chacun en bénéficie.

### Points clés
1. **Défauts bois** : nœud fragilisant (éliminatoire), fissure (éliminatoire si >5mm), cerne (acceptable si hors zone visible).
2. **Défauts dimensionnels** : hors tolérance (éliminatoire sur cotes critiques, acceptable sur zones non fonctionnelles selon l'écart).
3. **Défauts d'assemblage** : jeu excessif (éliminatoire), trace de colle apparente (acceptable si non visible en usage), défaut d'angle (éliminatoire si >0,5°).
4. **Défauts de finition** : coulure (éliminatoire si visible en usage), zone mate (retouchable), éclat de peinture (éliminatoire).
5. **Défauts de sécurité** : arête vive (éliminatoire), pièce détachable par enfant <3 ans (éliminatoire), tout ce qui contrevient à EN71 (éliminatoire).

### Idées reçues
- **Idée reçue 1 :** "Un défaut acceptable, c'est un défaut qu'on laisse passer."
  → Réalité : Un défaut acceptable est un défaut qui ne compromet ni la sécurité, ni la fonctionnalité, ni l'expérience du client. Il est documenté — pas ignoré.

- **Idée reçue 2 :** "Un nœud dans le bois c'est toujours acceptable — c'est naturel."
  → Réalité : Un nœud noir, traversant, ou situé dans une zone de contrainte est éliminatoire. Il peut provoquer une rupture du jouet en usage. Le caractère "naturel" ne dispense pas du contrôle.

- **Idée reçue 3 :** "Une coulure de peinture sur le dessous du jouet, ça ne se voit pas."
  → Réalité : Si la coulure est visible quand le jouet est posé en situation d'usage normale, elle est éliminatoire. Si elle est uniquement visible en retournant le jouet à 180°, elle est acceptable — à documenter.

### Chiffres clés
- 5 catégories de défauts : bois, dimensionnel, assemblage, finition, sécurité
- Éliminatoire = pièce non expédiable, à reprendre ou à déclasser
- Acceptable = documenté, non bloquant
- Défauts sécurité : toujours éliminatoires, sans exception

### Exemples concrets

#### Exemple 1 — Le nœud en zone de contrainte
Un opérateur détecte un nœud noir de 8 mm sur une planche de hêtre destinée aux bras d'un jouet articulé. La zone est en flexion lors de l'usage. Le nœud est éliminatoire — la pièce est mise de côté et la planche redébitée en évitant le défaut. La chute est valorisée en pièces non structurelles.

#### Exemple 2 — La zone mate acceptable
Après contrôle en lumière rasante, un cube présente une petite zone mate (2 cm²) sur une face latérale rarement visible. L'opérateur la documente sur la fiche de contrôle et la classe "acceptable". Si ce défaut récurrent sur ce lot, il déclenche une révision de la technique d'application.

### Liens avec d'autres compétences
- **Signaler et traiter un problème qualité** : tout défaut éliminatoire déclenche le processus de signalement.
- **Techniques de fabrication** : connaître les causes des défauts permet de les prévenir à la fabrication.

### Indicateurs de maîtrise
- [ ] L'apprenant peut citer les 5 catégories de défauts et donner un exemple éliminatoire dans chacune.
- [ ] L'apprenant sait distinguer un défaut éliminatoire d'un défaut acceptable.
- [ ] L'apprenant comprend pourquoi les défauts de sécurité sont toujours éliminatoires.
- [ ] L'apprenant documente les défauts acceptables plutôt que de les ignorer.

### Ressources externes
- Catalogue des défauts SIGYS avec photos (document interne) — disponible auprès du responsable qualité.

### Artefact manuel
- **Type :** Case study
- **Fichier :** sigys_defauts_catalogue.pdf
- **Description :** Catalogue photographique des défauts courants avec classification (éliminatoire/acceptable), causes probables et actions correctives. Outil de référence terrain indispensable.

---

## COMPÉTENCE 3 — Le contrôle final avant expédition

- **Niveau de difficulté :** Intermédiaire
- **Prérequis :** Les défauts courants, Les points de contrôle

### Description
Le contrôle final est la dernière barrière avant que le jouet arrive chez l'enfant. Il est exhaustif et documenté. Chez SIGYS, aucun produit ne quitte l'atelier sans avoir été contrôlé et validé — c'est une règle absolue qui ne souffre pas d'exception, même sous pression de délais.

### Points clés
1. **Contrôle visuel 360°** : inspection de toutes les faces en lumière directe et rasante — aspect, couleur, uniformité de la finition.
2. **Contrôle dimensionnel** : vérification des cotes critiques sur un échantillon du lot (5 % minimum, 100 % sur les petites séries <20 pièces).
3. **Contrôle fonctionnel** : test de toutes les fonctions du jouet — emboîtement, mobilité, résistance des assemblages.
4. **Contrôle sécurité** : test des arêtes (passage du doigt), test de traction sur les pièces rapportées, vérification de l'absence de pièces détachables pour les jouets <3 ans.
5. **Validation et traçabilité** : signature de la fiche de contrôle, étiquetage du lot validé, enregistrement dans l'ERP.

### Idées reçues
- **Idée reçue 1 :** "Un lot déjà partiellement contrôlé en cours de production n'a pas besoin de contrôle final."
  → Réalité : Les contrôles intermédiaires vérifient des étapes spécifiques. Le contrôle final vérifie le produit fini dans son ensemble — assemblage inclus. Les deux sont nécessaires.

- **Idée reçue 2 :** "Si on est en retard, on peut expédier et traiter les retours éventuels."
  → Réalité : Non. Un retour client coûte 10 à 20 fois plus cher qu'un contrôle final. Et pour les défauts de sécurité, un retour client peut signifier un rappel produit — un risque que SIGYS ne prend pas.

- **Idée reçue 3 :** "La signature sur la fiche de contrôle c'est une formalité administrative."
  → Réalité : La signature engage la responsabilité du contrôleur. En cas de réclamation client, la traçabilité permet d'identifier l'origine du problème et d'améliorer le processus. Ce n'est pas une sanction — c'est un système d'amélioration continue.

### Chiffres clés
- Contrôle dimensionnel : 100 % sur séries <20 pièces, 5 % minimum sur grandes séries
- Test de traction pièces rapportées : 90 N (norme EN71)
- Délai maximum contrôle final → expédition : 24h (temps de séchage peinture)
- 100 % des lots tracés dans l'ERP avant expédition

### Exemples concrets

#### Exemple 1 — Le lot bloqué avant expédition
Un lot de 30 animaux à empiler doit partir le jeudi pour livraison vendredi. Le contrôle final du mercredi révèle que 4 pièces ont des arêtes insuffisamment arrondies. Le lot est bloqué — les 4 pièces sont reprises à la ponceuse le jeudi matin, recontrolées, validées. Le lot part jeudi après-midi. Une heure de travail supplémentaire pour un envoi conforme.

#### Exemple 2 — Le test de traction
Sur un lot de cubes avec anneaux de préhension, l'opérateur teste chaque anneau en traction avec un dynamomètre étalonné. Un anneau cède à 75 N au lieu des 90 N requis. Le lot entier est mis en quarantaine, les anneaux vérifiés un par un. 8 anneaux sont remplacés. Le lot repart après nouveau contrôle. Aucun enfant ne recevra un cube avec un anneau défaillant.

### Liens avec d'autres compétences
- **Signaler et traiter un problème qualité** : un défaut détecté au contrôle final déclenche le processus qualité.
- **Gestion des approvisionnements** : la traçabilité des lots relie les produits finis aux matières premières utilisées.

### Indicateurs de maîtrise
- [ ] L'apprenant peut décrire les 5 étapes du contrôle final dans l'ordre.
- [ ] L'apprenant sait calculer le nombre de pièces à contrôler selon la taille du lot.
- [ ] L'apprenant effectue le test de sécurité correctement et connaît les seuils requis.
- [ ] L'apprenant complète et signe la fiche de contrôle final et enregistre dans l'ERP.

### Ressources externes
- Fiche de contrôle final SIGYS (document interne) — disponible auprès du responsable qualité.
- [Norme EN71 — tests de sécurité jouets](https://www.economie.gouv.fr/dgccrf/securite-des-jouets) — Site officiel — Débutant

### Artefact manuel
- **Type :** Case study
- **Fichier :** sigys_controle_final_fiche.pdf
- **Description :** Fiche de contrôle final complète avec liste de vérification, espaces de mesure, zones de signature et procédure d'enregistrement ERP. Formulaire utilisé en production.

---

*Fin de la base de connaissances — Domaine : Savoir-faire opérationnels — Thème : Contrôle qualité — 3 compétences*
*SIGYS / Clartée — Usage interne*
