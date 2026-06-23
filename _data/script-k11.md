# SCRIPT PÉDAGOGIQUE — Module K11 : La crise de l'eau
# Format : lexique de moments. Chaque moment = un verbe-clé + paramètres.
# Le contenu factuel vient de kb-k11.md. Ce script n'invente aucun fait.

INTRO_MODULE
# "L'eau semble partout, mais l'eau réellement disponible est infime. En 5 minutes, explorons trois choses : les usages de l'eau, les risques de pénurie, et les usages cachés de l'eau."

# ════════ SÉQUENCE 1 : Les usages de l'eau ════════
INTRO_SEQUENCE seq=1

QUESTIONNER notion=1.1 artefact=qcm
  FEEDBACK_OK = "Exactement. Moins de 1 % de l'eau de la Terre est accessible à l'homme."
  FEEDBACK_KO = "En réalité, moins de 1 % seulement de l'eau de la Terre est accessible à l'homme."
  REPONSE = "moins de 1 %"
  DISTRACTEURS = ["environ 10 %", "environ 30 %"]

MEDIA notion=1.1
TRANSMETTRE notion=1.1 artefact=definition

QUESTIONNER notion=1.2 artefact=dragdrop
  FEEDBACK_OK = "Parfait. L'agriculture domine très largement avec 70 % de l'eau douce."
  FEEDBACK_KO = "Pas tout à fait : agriculture 70 %, industrie 20 %, ménages 12 %."
  REPONSE = {"Agriculture":"70 %","Industrie":"20 %","Ménages":"12 %"}

TRANSMETTRE notion=1.2 artefact=key_numbers
# Élément complémentaire S07 (x7,3 prélèvements) disponible si l'apprenant demande.

# ════════ SÉQUENCE 2 : Des risques de pénurie ════════
INTRO_SEQUENCE seq=2

TRANSMETTRE notion=2.1 artefact=definition
QUESTIONNER notion=2.1 artefact=scale
  FEEDBACK_OK = "Oui. Près de la moitié de la population mondiale est touchée par de graves pénuries au moins une partie de l'année."
  FEEDBACK_KO = "C'est plus grave : près de la moitié de la population mondiale est concernée."
  REPONSE = "50 %"

QUESTIONNER notion=2.2 artefact=qcm
  FEEDBACK_OK = "Exact. 42 % de l'eau domestique mondiale n'est pas correctement traitée."
  FEEDBACK_KO = "En fait, 42 % de l'eau domestique mondiale n'est pas correctement traitée pour être potable."
  REPONSE = "42 %"
  DISTRACTEURS = ["12 %", "25 %"]

# ════════ SÉQUENCE 3 : Les usages cachés de l'eau ════════
INTRO_SEQUENCE seq=3

TRANSMETTRE notion=3.1 artefact=definition

QUESTIONNER notion=3.2 artefact=qcm
  FEEDBACK_OK = "Oui ! Retenez cette douche de 100 litres, c'est notre unité de comparaison."
  FEEDBACK_KO = "Une douche de 5 minutes, c'est environ 100 litres. Gardez ce repère en tête."
  REPONSE = "environ 100 litres"
  DISTRACTEURS = ["environ 30 litres", "environ 300 litres"]

MEDIA notion=3.2
TRANSMETTRE notion=3.2 artefact=key_numbers

SYNTHESE_MODULE
# Rappel des 3 points clés (1 % accessible, 70 % agriculture, l'eau invisible domine) + map_update + lien KIT.
