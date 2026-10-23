// Real analyze-circuit output for src/assets/demo-board.jpg (trained YOLO + AI), captured for offline classroom demos.
import type { DiagnosticData } from "@/components/DiagnosticResult";

export const demoDiagnostic: Record<"fr" | "en", DiagnosticData> = {
 "fr": {
  "summary": "Inspection visuelle d'une carte de développement monocarte (SBC) de marque Forlinx avec processeur embarqué, mémoire, interfaces réseau double RJ45 (Fly Core), connectique USB-C, antenne Wi-Fi/RF et connecteurs d'extension. L'assemblage général est propre, les composants de surface et traversants semblent bien alignés sans dommage thermique ni court-circuit flagrant observable à cette résolution. Il s'agit d'une évaluation visuelle provisoire, pas d'une confirmation du fonctionnement électrique ; confirmez les défauts suspectés par des mesures adaptées.",
  "overallStatus": "ok",
  "overallSeverity": 1,
  "detectionMethod": "Modèle YOLO entraîné (10 classes de composants) + inspection visuelle IA — diagnostic provisoire",
  "components": [
   {
    "name": "Connecteur RJ45 / Réseau Fly Core FC-202GYDNL",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Connecteur Ethernet blindé double port Fly Core FC-202GYDNL 2529. Boîtier métallique intact sans déformation.",
    "location": "Bord inférieur central",
    "boundingBox": {
     "x": 0.647,
     "y": 0.553,
     "width": 0.103,
     "height": 0.047
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "20 min",
    "replacementPart": "FC-202GYDNL"
   },
   {
    "name": "Circuit intégré mémoire RAM / Flash",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Boîtier BGA monté en surface pour la mémoire système, sérigraphie Forlinx adjacente. Aucune fissure visible.",
    "location": "Centre du PCB",
    "boundingBox": {
     "x": 0.509,
     "y": 0.337,
     "width": 0.105,
     "height": 0.064
    },
    "solderQuality": "good",
    "repairDifficulty": "expert",
    "estimatedRepairTime": "45 min",
    "replacementPart": "Non spécifié"
   },
   {
    "name": "SoC / Processeur principal",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Processeur central sous boîtier BGA avec marquage Forlinx. Absence de craquelure ou de trace de surchauffe.",
    "location": "Centre gauche du PCB",
    "boundingBox": {
     "x": 0.384,
     "y": 0.341,
     "width": 0.127,
     "height": 0.058
    },
    "solderQuality": "good",
    "repairDifficulty": "expert",
    "estimatedRepairTime": "60 min",
    "replacementPart": "Non lisible"
   },
   {
    "name": "Connecteur Jack d'alimentation DC",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Prise barillet DC pour alimentation d'entrée. Corps plastique noir en bon état mécanique.",
    "location": "Coin supérieur gauche de la carte",
    "boundingBox": {
     "x": 0.225,
     "y": 0.544,
     "width": 0.038,
     "height": 0.026
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "DC Barrel Jack standard"
   },
   {
    "name": "Barrette de broches d'extension (Header gauche)",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Connecteur mâle 2.54mm double rangée pour GPIO. Broches rectilignes sans corrosion.",
    "location": "Bord latéral gauche",
    "boundingBox": {
     "x": 0.189,
     "y": 0.258,
     "width": 0.1,
     "height": 0.228
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "Header 2x20 2.54mm"
   },
   {
    "name": "Barrette de broches GPIO (Header droit)",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Connecteur mâle GPIO à broches multiples colorées/noires. Aucune broche tordue observée.",
    "location": "Bord latéral supérieur droit",
    "boundingBox": {
     "x": 0.687,
     "y": 0.169,
     "width": 0.118,
     "height": 0.177
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "Header multi-pin standard"
   },
   {
    "name": "Module eMMC / Flash secondaire",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Puce de stockage ou de gestion d'alimentation montée en surface.",
    "location": "Zone centrale supérieure",
    "boundingBox": {
     "x": 0.487,
     "y": 0.279,
     "width": 0.125,
     "height": 0.054
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "30 min",
    "replacementPart": "Non spécifié"
   },
   {
    "name": "Module sans fil blindé (Wi-Fi/BT)",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Module radio RF blindé avec QR code sérigraphié, relié au connecteur d'antenne SMA/coaxial.",
    "location": "Coin inférieur droit",
    "boundingBox": {
     "x": 0.787,
     "y": 0.491,
     "width": 0.042,
     "height": 0.022
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "30 min",
    "replacementPart": "Module Wi-Fi/BT LGA"
   },
   {
    "name": "Port USB Type-A vertical",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Connecteur USB Type-A vertical blindé métal.",
    "location": "Haut du circuit",
    "boundingBox": {
     "x": 0.411,
     "y": 0.184,
     "width": 0.125,
     "height": 0.059
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "USB-A vertical PTH"
   },
   {
    "name": "Circuit intégré U26 / Contrôleur d'interface",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Petit boîtier SMD (QFN/SOIC) à proximité des bus de communication.",
    "location": "Zone inférieure droite",
    "boundingBox": {
     "x": 0.373,
     "y": 0.405,
     "width": 0.031,
     "height": 0.015
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "Non lisible"
   },
   {
    "name": "Connecteur FPC / Ruban plat",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Connecteur nappe flexible à levier (MIPI CSI/DSI ou similaire).",
    "location": "Partie médiane basse",
    "boundingBox": {
     "x": 0.453,
     "y": 0.487,
     "width": 0.03,
     "height": 0.01
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "FPC Connector"
   },
   {
    "name": "Circuit intégré / Régulateur PMIC",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Composant de gestion d'énergie compact monté en surface.",
    "location": "Quart centre supérieur",
    "boundingBox": {
     "x": 0.388,
     "y": 0.308,
     "width": 0.039,
     "height": 0.019
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "20 min",
    "replacementPart": "Non lisible"
   },
   {
    "name": "Lecteur carte MicroSD",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Slot métallique pour carte MicroSD monté sur le bord supérieur.",
    "location": "Bord supérieur",
    "boundingBox": {
     "x": 0.537,
     "y": 0.133,
     "width": 0.122,
     "height": 0.109
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "20 min",
    "replacementPart": "MicroSD slot SMD"
   },
   {
    "name": "Bouton poussoir / Commutateur rouge",
    "type": "other",
    "status": "ok",
    "severity": 1,
    "details": "Interrupteur ou commutateur miniature à levier/poussoir rouge.",
    "location": "Zone supérieure droite",
    "boundingBox": {
     "x": 0.665,
     "y": 0.243,
     "width": 0.052,
     "height": 0.054
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "10 min",
    "replacementPart": "Tactile switch / DIP switch"
   },
   {
    "name": "Condensateur céramique CMS (MLCC)",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Condensateur céramique multicouche de découplage en bon état.",
    "location": "Proximité entrée alimentation",
    "boundingBox": {
     "x": 0.253,
     "y": 0.535,
     "width": 0.008,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non mesurée"
   },
   {
    "name": "Condensateur céramique CMS (MLCC)",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Composant passif céramique beige/marron, soudures bien formées.",
    "location": "Centre inférieur",
    "boundingBox": {
     "x": 0.505,
     "y": 0.464,
     "width": 0.007,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non mesurée"
   },
   {
    "name": "Condensateur céramique CMS (MLCC)",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Condensateur MLCC, terminaisons étamées propres.",
    "location": "Zone alimentation gauche",
    "boundingBox": {
     "x": 0.246,
     "y": 0.528,
     "width": 0.007,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non mesurée"
   },
   {
    "name": "Résistance CMS",
    "type": "resistor",
    "status": "ok",
    "severity": 1,
    "details": "Résistance CMS boîtier 0402/0603 intacte.",
    "location": "Centre droit",
    "boundingBox": {
     "x": 0.578,
     "y": 0.436,
     "width": 0.009,
     "height": 0.008
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non lisible"
   },
   {
    "name": "Header / Cavalier de configuration",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Rangée de broches mâles de sélection ou de débogage.",
    "location": "Quart supérieur gauche",
    "boundingBox": {
     "x": 0.352,
     "y": 0.244,
     "width": 0.087,
     "height": 0.042
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "10 min",
    "replacementPart": "Header 2.54mm"
   },
   {
    "name": "Résistance CMS",
    "type": "resistor",
    "status": "ok",
    "severity": 1,
    "details": "Résistance CMS miniature, corps intact.",
    "location": "Centre droit",
    "boundingBox": {
     "x": 0.567,
     "y": 0.437,
     "width": 0.009,
     "height": 0.008
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non lisible"
   },
   {
    "name": "Connecteur d'extension MIPI / Nappe FPC",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Connecteur avec nappe flexible connectée (caméra ou écran). Nappe intacte sans pliure excessive.",
    "location": "Bord droit médian",
    "boundingBox": {
     "x": 0.652,
     "y": 0.482,
     "width": 0.137,
     "height": 0.067
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "10 min",
    "replacementPart": "Nappe FPC / Connecteur FPC"
   },
   {
    "name": "Circuit intégré / Interface",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Puce SMD pour gestion des entrées/sorties ou interface physique.",
    "location": "Zone centrale basse",
    "boundingBox": {
     "x": 0.407,
     "y": 0.404,
     "width": 0.035,
     "height": 0.014
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "Non spécifié"
   },
   {
    "name": "Circuit intégré pilote / Émetteur-récepteur",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Puce CMS liée aux bus de données ou au conditionnement de signal.",
    "location": "Centre inférieur",
    "boundingBox": {
     "x": 0.503,
     "y": 0.474,
     "width": 0.058,
     "height": 0.019
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "20 min",
    "replacementPart": "Non spécifié"
   },
   {
    "name": "Port USB Type-C (DEBUG / Données)",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Connecteur femelle USB-C monté en surface avec languettes traversantes. Ancrage solide.",
    "location": "Bord inférieur droit",
    "boundingBox": {
     "x": 0.603,
     "y": 0.566,
     "width": 0.043,
     "height": 0.017
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "20 min",
    "replacementPart": "Type-C 16/24-pin Receptacle"
   },
   {
    "name": "Condensateur céramique CMS (MLCC)",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Condensateur MLCC miniature, aucun signe de craquelure mécanique.",
    "location": "Zone alimentation gauche",
    "boundingBox": {
     "x": 0.236,
     "y": 0.537,
     "width": 0.008,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non mesurée"
   },
   {
    "name": "Circuit intégré logique / Horloge",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Composant SOIC/TSSOP compact pour logique ou distribution d'horloge.",
    "location": "Quart inférieur gauche",
    "boundingBox": {
     "x": 0.327,
     "y": 0.398,
     "width": 0.034,
     "height": 0.012
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "15 min",
    "replacementPart": "Non spécifié"
   },
   {
    "name": "Condensateur céramique CMS (MLCC)",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Condensateur de découplage CMS, soudures complètes et brillantes.",
    "location": "Zone alimentation gauche",
    "boundingBox": {
     "x": 0.237,
     "y": 0.528,
     "width": 0.009,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non mesurée"
   },
   {
    "name": "Résistance CMS",
    "type": "resistor",
    "status": "ok",
    "severity": 1,
    "details": "Résistance CMS pour adaptation de ligne ou pull-up.",
    "location": "Zone centrale",
    "boundingBox": {
     "x": 0.523,
     "y": 0.463,
     "width": 0.006,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non lisible"
   },
   {
    "name": "Condensateur céramique CMS (MLCC)",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Condensateur CMS de filtrage.",
    "location": "Zone centrale droite",
    "boundingBox": {
     "x": 0.574,
     "y": 0.444,
     "width": 0.008,
     "height": 0.008
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "5 min",
    "replacementPart": "Valeur non mesurée"
   }
  ],
  "solderAnalysis": {
   "overallQuality": "good",
   "coldJoints": 0,
   "bridges": 0,
   "excessSolder": 0,
   "insufficientSolder": 0,
   "liftedComponents": 0
  },
  "recommendations": [
   "Aucune anomalie physique ou défaut de soudure visible n'est détecté sur cette vue d'ensemble.",
   "Pour valider l'intégrité électrique, procéder à un test de continuité hors tension sur les lignes d'alimentation principales (3.3V, 5V, GND) afin d'exclure tout court-circuit interne.",
   "Si un problème fonctionnel persiste, réaliser des clichés macro haute résolution avec éclairage diffus sur la zone d'alimentation et sous les circuits BGA."
  ],
  "repairGuide": [],
  "partsToReplace": [],
  "analysisQuality": "high",
  "detectionSource": "yolo"
 },
 "en": {
  "summary": "Visual inspection of a single-board computer / development carrier board with mounted system-on-module (SoM, marked Forlinx), dual RJ45 Ethernet jacks (Fly Core), Wi-Fi/BT module, USB-C ports, and peripheral headers. The assembly appears structurally intact with no obvious catastrophic burn damage or cracked packaging visible under current lighting. Perspective angle introduces foreshortening on upper connectors and headers. This is a provisional visual assessment, not confirmation of electrical operation; confirm suspected faults with appropriate measurements.",
  "overallStatus": "ok",
  "overallSeverity": 1,
  "detectionMethod": "Trained YOLO model (10 component classes) + AI visual inspection — provisional diagnosis",
  "components": [
   {
    "name": "USB-C / Debug Connector Port",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Surface-mount USB Type-C receptacle adjacent to serial debug section. Mechanical shield anchor tabs and shell appear intact without physical deformation.",
    "location": "Bottom right edge, adjacent to debug marking",
    "boundingBox": {
     "x": 0.647,
     "y": 0.553,
     "width": 0.103,
     "height": 0.047
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SoM Memory IC (eMMC / LPDDR)",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "BGA memory package mounted on the central System-on-Module. Molded epoxy encapsulation is intact with no surface cracking or thermal discoloration.",
    "location": "Center-right section of core module",
    "boundingBox": {
     "x": 0.509,
     "y": 0.337,
     "width": 0.105,
     "height": 0.064
    },
    "solderQuality": "good",
    "repairDifficulty": "expert",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Application Processor SoC (Forlinx Core)",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Primary system processor BGA IC on the core board. No visible delamination, burns, or physical impact damage observed on top surface.",
    "location": "Center of SoM core board",
    "boundingBox": {
     "x": 0.384,
     "y": 0.341,
     "width": 0.127,
     "height": 0.058
    },
    "solderQuality": "good",
    "repairDifficulty": "expert",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Ethernet PHY / Interface IC",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Small-outline package near dual RJ45 Ethernet magnetics section. Terminations show clean reflective solder with no bridging.",
    "location": "Lower-left side near RJ45 module",
    "boundingBox": {
     "x": 0.225,
     "y": 0.544,
     "width": 0.038,
     "height": 0.026
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Pin Header Strip J1",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Single-row through-hole expansion header strip along left edge. Pins are straight with uniform spacing; through-hole joints appear complete.",
    "location": "Left board perimeter",
    "boundingBox": {
     "x": 0.189,
     "y": 0.258,
     "width": 0.1,
     "height": 0.228
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Pin Header Strip J2 (Right Expansion)",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Dual/single row pin header running along upper right edge. Pins intact without bent leads.",
    "location": "Upper right edge",
    "boundingBox": {
     "x": 0.687,
     "y": 0.169,
     "width": 0.118,
     "height": 0.177
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Power Management IC / Secondary IC",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Integrated circuit package located on upper portion of SoM substrate. Molded encapsulation intact.",
    "location": "Top area of SoM",
    "boundingBox": {
     "x": 0.487,
     "y": 0.279,
     "width": 0.125,
     "height": 0.054
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "RF Connector / Feed Section",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "SMA/IPEX RF feed point connected to external antenna assembly. Joint mounting brackets are physically secure.",
    "location": "Far right perimeter, below camera ribbon connector",
    "boundingBox": {
     "x": 0.787,
     "y": 0.491,
     "width": 0.042,
     "height": 0.022
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Top Auxiliary Header / Connector",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Multi-pin header block near DC jack and top edge. Shrouded pins aligned correctly.",
    "location": "Upper center-left edge",
    "boundingBox": {
     "x": 0.411,
     "y": 0.184,
     "width": 0.125,
     "height": 0.059
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Interface Controller IC",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Small surface-mount integrated circuit package along lower boundary of SoM board edge connector.",
    "location": "Center-left below SoM processor",
    "boundingBox": {
     "x": 0.373,
     "y": 0.405,
     "width": 0.031,
     "height": 0.015
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Connector / Jumper Block",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Small low-profile connector interface near Ethernet transformer cans.",
    "location": "Lower center region, above RJ45 assembly",
    "boundingBox": {
     "x": 0.453,
     "y": 0.487,
     "width": 0.03,
     "height": 0.01
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Oscillator / Small IC",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Small-scale integrated circuit or packaged active oscillator on SoM periphery.",
    "location": "Upper-left corner of SoM",
    "boundingBox": {
     "x": 0.388,
     "y": 0.308,
     "width": 0.039,
     "height": 0.019
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "USB Type-A Host Receptacle",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "Vertical metallic USB host connector socket on upper board edge. Metallic shielding and ground anchor joints appear structurally intact.",
    "location": "Top center edge",
    "boundingBox": {
     "x": 0.537,
     "y": 0.133,
     "width": 0.122,
     "height": 0.109
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Red Configuration Switch / DIP Block",
    "type": "other",
    "status": "ok",
    "severity": 1,
    "details": "Red packaged slide/toggle configuration switch block. Plastic housing shows no heat deformities.",
    "location": "Upper right sector near header",
    "boundingBox": {
     "x": 0.665,
     "y": 0.243,
     "width": 0.052,
     "height": 0.054
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Unidentified SMD Component (MLCC / Resistor)",
    "type": "other",
    "status": "ok",
    "severity": 1,
    "details": "Surface-mount chip component in Ethernet termination section; designator not resolvable at this distance.",
    "location": "Lower-left, above RJ45 socket",
    "boundingBox": {
     "x": 0.253,
     "y": 0.535,
     "width": 0.008,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Decoupling Capacitor",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Ceramic MLCC capacitor in power rail conditioning section near Ethernet filter block. End terminations cleanly soldered.",
    "location": "Lower center, near RJ45 transformer shield",
    "boundingBox": {
     "x": 0.505,
     "y": 0.464,
     "width": 0.007,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Chip Capacitor",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "MLCC capacitor package on carrier board routing track. Properly seated without tombstoning.",
    "location": "Lower-left quadrant",
    "boundingBox": {
     "x": 0.246,
     "y": 0.528,
     "width": 0.007,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Resistor",
    "type": "resistor",
    "status": "ok",
    "severity": 1,
    "details": "Surface mount chip resistor near transceiver cluster. Solder fillets properly formed at both terminals.",
    "location": "Center-right lower region",
    "boundingBox": {
     "x": 0.578,
     "y": 0.436,
     "width": 0.009,
     "height": 0.008
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Board-to-Board Interconnect Header",
    "type": "connector",
    "status": "ok",
    "severity": 1,
    "details": "High-density mezzanine / edge header joining carrier board to SoM board.",
    "location": "Upper center-left, SoM mounting interface",
    "boundingBox": {
     "x": 0.352,
     "y": 0.244,
     "width": 0.087,
     "height": 0.042
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Chip Resistor",
    "type": "resistor",
    "status": "ok",
    "severity": 1,
    "details": "Surface mount passive component with intact end metallization and shiny solder meniscus.",
    "location": "Center-right midsection",
    "boundingBox": {
     "x": 0.567,
     "y": 0.437,
     "width": 0.009,
     "height": 0.008
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Wi-Fi / Bluetooth Module (Fn-Link)",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Shielded wireless module with visible QR code and part marking label (Fn-Link). Castellation soldering along edges shows solid adhesion.",
    "location": "Lower right section, above USB-C port",
    "boundingBox": {
     "x": 0.652,
     "y": 0.482,
     "width": 0.137,
     "height": 0.067
    },
    "solderQuality": "good",
    "repairDifficulty": "hard",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Small SMD Component / Diode",
    "type": "other",
    "status": "ok",
    "severity": 1,
    "details": "Miniature SMD package on carrier board routing. No physical fracture or burnt PCB trace visible.",
    "location": "Mid-lower left section",
    "boundingBox": {
     "x": 0.407,
     "y": 0.404,
     "width": 0.035,
     "height": 0.014
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Logic / Driver IC",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Small SMD IC package positioned above Ethernet jack. Leads and joints are cleanly aligned.",
    "location": "Lower center quadrant",
    "boundingBox": {
     "x": 0.503,
     "y": 0.474,
     "width": 0.058,
     "height": 0.019
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "ESD Protection / Interface IC",
    "type": "ic",
    "status": "ok",
    "severity": 1,
    "details": "Miniature protection IC near bottom USB/serial connectors. Package body intact.",
    "location": "Bottom center-right edge",
    "boundingBox": {
     "x": 0.603,
     "y": 0.566,
     "width": 0.043,
     "height": 0.017
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Ceramic Capacitor MLCC",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Surface mount capacitor in network interface circuit. End fillets well wetted.",
    "location": "Lower-left cluster",
    "boundingBox": {
     "x": 0.236,
     "y": 0.537,
     "width": 0.008,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Transistor / Dual Diode",
    "type": "other",
    "status": "ok",
    "severity": 1,
    "details": "SOT-style or similar miniature package near board edge. Leads properly seated.",
    "location": "Left mid-section",
    "boundingBox": {
     "x": 0.327,
     "y": 0.398,
     "width": 0.034,
     "height": 0.012
    },
    "solderQuality": "good",
    "repairDifficulty": "medium",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Ceramic Filter Capacitor",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "Miniature MLCC passive component adjacent to Ethernet routing lanes.",
    "location": "Lower-left cluster",
    "boundingBox": {
     "x": 0.237,
     "y": 0.528,
     "width": 0.009,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "SMD Resistor R",
    "type": "resistor",
    "status": "ok",
    "severity": 1,
    "details": "Chip resistor located in passive cluster between SoM connector and Ethernet module.",
    "location": "Lower central section",
    "boundingBox": {
     "x": 0.523,
     "y": 0.463,
     "width": 0.006,
     "height": 0.007
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   },
   {
    "name": "Ceramic Decoupling Capacitor",
    "type": "capacitor",
    "status": "ok",
    "severity": 1,
    "details": "MLCC capacitor on supply trace near wireless transceiver module.",
    "location": "Lower center-right",
    "boundingBox": {
     "x": 0.574,
     "y": 0.444,
     "width": 0.008,
     "height": 0.008
    },
    "solderQuality": "good",
    "repairDifficulty": "easy",
    "estimatedRepairTime": "N/A",
    "replacementPart": "N/A"
   }
  ],
  "solderAnalysis": {
   "overallQuality": "good",
   "coldJoints": 0,
   "bridges": 0,
   "excessSolder": 0,
   "insufficientSolder": 0,
   "liftedComponents": 0
  },
  "recommendations": [
   "No immediate rework or component replacements required based on visual inspection.",
   "If diagnosing a functional fault, take a perpendicular top-down macro photo of the SoM and power supply regulators to inspect unreadable markings.",
   "Verify supply voltage rails (5V/3.3V/1.8V) using a digital multimeter with proper ground reference before conducting full system bring-up."
  ],
  "repairGuide": [],
  "partsToReplace": [],
  "analysisQuality": "high",
  "detectionSource": "yolo"
 }
} as unknown as Record<"fr" | "en", DiagnosticData>;
