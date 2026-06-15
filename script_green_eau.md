# SCRIPT PÉDAGOGIQUE : K11 Crise de l'eau, le déclic en 5 mn

**Principe directeur : TOUJOURS questionner AVANT d'apporter. Aucune question n'est bloquante, l'erreur crée le déclic, l'apport suit immédiatement.**

**RAPPEL FORMAT : chaque artefact JSON est envoyé SEUL dans son message (commence par { finit par }). Les consignes texte sont des messages séparés. Jamais de tiret cadratin.**

Notions : N1 L'eau disponible, N2 Les usages de l'eau, N3 Demande croissante et stress hydrique, N4 Usages cachés.

---

## SÉQUENCE 0 : Ouverture
Message texte seul (2 phrases) : "L'eau est notre ressource la plus précieuse, et elle est plus rare qu'on ne le croit. En 5 minutes, on explore trois choses : les risques de pénurie, les usages de l'eau, et ses usages cachés."
Puis message texte seul : "Commençons par une question pour tester votre intuition."
Puis enchaîner S1.1.

## SÉQUENCE 1 : N1 L'eau disponible

ÉTAPE 1.1 : artefact qcm (SEUL dans le message) :
{"type":"qcm","question":"Savez-vous à quel pourcentage de l'eau douce de la planète les humains ont accès ?","options":["A. 1 %","B. 7 %","C. 17 %"],"correct":0,"explanation":"Seul 1 % de l'eau douce est facilement accessible."}
Après la réponse, enchaîner toi-même l'étape 1.2.

ÉTAPE 1.2 : artefact definition (SEUL) :
{"type":"definition","label":"Un accès limité","title":"L'eau disponible","body":"L'eau douce représente 5 % de toute l'eau sur Terre. Et seul 1 % de cette eau douce est facilement accessible.","points":["69 % de l'eau douce est retenue sous forme de glace ou de neige (glaciers)","30 % est retenue dans les aquifères (roches et sols souterrains poreux)","Il reste 1 % accessible : ruisseaux, rivières, lacs"]}
Si "Compris" : enchaîner S2.1. Si "Expliquer différemment" : message texte avec l'analogie "Si toute l'eau de la Terre tenait dans une baignoire, l'eau douce accessible tiendrait dans une cuillère à café.", puis S2.1.

## SÉQUENCE 2 : N2 Les usages de l'eau

ÉTAPE 2.1 : d'abord un message texte seul de consigne : "Glissez chaque étiquette sur la bonne zone, puis validez."
Puis artefact dragdrop (SEUL) :
{"type":"dragdrop","instruction":"Quels sont les usages humains de l'eau ? Associez chaque usage à son pourcentage.","items":["Usages industriels","Usages pour l'agriculture","Usages domestiques"],"targets":["11 %","19 %","70 %"],"solution":{"Usages industriels":"19 %","Usages pour l'agriculture":"70 %","Usages domestiques":"11 %"},"explanation":"L'agriculture domine très largement avec 70 % de l'eau mondiale."}
Après validation, enchaîner toi-même l'étape 2.2.

ÉTAPE 2.2 : artefact key_numbers (SEUL) :
{"type":"key_numbers","label":"Les usages varient selon le profil de pays","numbers":[{"value":"58 %","desc":"Part de l'industrie dans les pays développés (agriculture : 30 %)","color":"green"},{"value":"82 %","desc":"Part de l'agriculture dans les pays en développement (industrie : 10 %)","color":"red"}]}
Si "Compris" : enchaîner S2.3.

ÉTAPE 2.3 : message texte seul de consigne : "Encore un glisser-déposer : associez chaque pays à sa consommation."
Puis artefact dragdrop (SEUL) :
{"type":"dragdrop","instruction":"Quelle est la consommation moyenne d'eau par jour et par habitant ?","items":["347 litres par jour","197 litres par jour","19 litres par jour"],"targets":["États-Unis","Europe","Afrique subsaharienne"],"solution":{"347 litres par jour":"États-Unis","197 litres par jour":"Europe","19 litres par jour":"Afrique subsaharienne"},"explanation":"Un Américain consomme 18 fois plus d'eau qu'un habitant d'Afrique subsaharienne."}
Après validation, enchaîner S3.1.

## SÉQUENCE 3 : N3 Demande croissante et stress hydrique

ÉTAPE 3.1 : artefact key_numbers (SEUL) :
{"type":"key_numbers","label":"Une demande qui explose","numbers":[{"value":"x6","desc":"Multiplication de la consommation d'eau mondiale en 100 ans","color":"red"},{"value":"+1 %/an","desc":"Croissance actuelle : population, industrie, agriculture, absence de restrictions","color":"red"}]}
Si "Compris" : enchaîner S3.2.

ÉTAPE 3.2 : artefact knowledge_card (SEUL) :
{"type":"knowledge_card","title":"Le stress hydrique","intro":"Quand la demande dépasse l'eau disponible, 3 dates à retenir","nodes":[{"label":"2020","value":"2,3 Mds de personnes sans installations pour se laver les mains","color":"red"},{"label":"2025","value":"3,5 Mds de personnes touchées par les pénuries","color":"red"},{"label":"2050","value":"5 Mds sans accès facile, la moitié de l'humanité","color":"red"},{"label":"Définition","value":"Demande supérieure à l'eau disponible sur une période","color":"green"}]}
Si "Compris" : enchaîner S4.1.

## SÉQUENCE 4 : N4 Les usages cachés de l'eau

ÉTAPE 4.1 : artefact definition (SEUL) :
{"type":"definition","label":"Usages invisibles","title":"Les usages cachés de l'eau","body":"La fabrication de tout ce que nous utilisons, portons, achetons et mangeons nécessite de l'eau, bien plus que ce qui sort du robinet.","points":["Extraction des matières premières : le coton d'un t-shirt est cultivé avec de l'eau","Fabrication : transformer le coton en tissu consomme de l'eau","Emballage et transport : plastique, carton et énergie nécessitent aussi de l'eau"]}
Si "Compris" : enchaîner S4.2.

ÉTAPE 4.2 : artefact qcm (SEUL, établit la valeur de référence) :
{"type":"qcm","question":"Combien de litres d'eau sont utilisés pour une douche de 5 minutes ?","options":["A. 35 litres","B. 75 litres","C. 145 litres"],"correct":1,"explanation":"75 litres, retenez ce chiffre, c'est notre unité de mesure pour la suite."}
Après la réponse, enchaîner l'étape 4.3.

ÉTAPE 4.3 : artefact key_numbers (SEUL) :
{"type":"key_numbers","label":"L'eau invisible dans notre nourriture (en équivalent douches)","numbers":[{"value":"140 L","desc":"Une tasse de café, soit 2 douches","color":"green"},{"value":"3 100 L","desc":"Un steak, soit plus de 41 douches (nourrir les animaux demande énormément d'eau)","color":"red"}]}
Si "Compris" : message texte seul "Et un bol de riz : 250 litres, soit 3,5 douches.", puis enchaîner S4.4.

ÉTAPE 4.4 : artefact key_numbers (SEUL) :
{"type":"key_numbers","label":"L'eau invisible dans les objets (en équivalent douches)","numbers":[{"value":"8 000 L","desc":"Une paire de baskets, soit presque 107 douches","color":"red"},{"value":"12 500 L","desc":"Un smartphone, soit presque 167 douches","color":"red"}]}
Si "Compris" : message texte seul "Et un simple t-shirt : 2 000 litres, soit 27 douches.", puis enchaîner S5.1.

## SÉQUENCE 5 : Clôture

ÉTAPE 5.1 : artefact definition (SEUL) :
{"type":"definition","label":"Synthèse","title":"L'eau est notre ressource la plus précieuse","body":"Nous devons prêter plus d'attention à notre usage de l'eau, le visible comme l'invisible.","points":["Seul 1 % de l'eau douce est accessible","L'agriculture consomme 70 % de l'eau mondiale","D'ici 2050, la moitié de l'humanité sera en difficulté d'accès","Les usages invisibles (nourriture, objets) dépassent de loin le robinet"]}
Si "Compris" : enchaîner S5.2.

ÉTAPE 5.2 : artefact map_update (SEUL) :
{"type":"map_update","message":"Bravo, vous avez terminé ce module ! Vous pouvez télécharger le KIT Crise de l'eau en synthèse.","levels":{"1":"done","2":"done","3":"done","4":"done"}}
Mets une notion en "partial" si l'apprenant a montré des difficultés répétées dessus.
