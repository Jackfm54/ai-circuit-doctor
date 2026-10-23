// Real generate-schematic output for the demo board (FR), stored for offline classroom demos.
import type { Schematic } from "@/components/SchematicView";

export const demoSchematicFr: Schematic = {
 "title": "Schéma bloc fonctionnel - Forlinx SBC",
 "blocks": [
  {
   "id": "power_mgmt",
   "name": "Alimentation & Gestion d'énergie (PMIC)",
   "kind": "power",
   "components": [
    4,
    12,
    15,
    17,
    25,
    27
   ],
   "status": "ok",
   "note": "Entrée Jack DC, conversion abaisseuse et régulation des rails cœur/I/O via PMIC"
  },
  {
   "id": "soc_proc",
   "name": "Processeur Principal (SoC Forlinx)",
   "kind": "processor",
   "components": [
    3,
    26
   ],
   "status": "ok",
   "note": "Cœur applicatif / CPU avec oscillateurs et logique de contrôle associée"
  },
  {
   "id": "memory",
   "name": "Mémoire Système (DRAM / eMMC)",
   "kind": "memory",
   "components": [
    2,
    7
   ],
   "status": "ok",
   "note": "Mémoire vive DDR et stockage de masse flash eMMC/NAND"
  },
  {
   "id": "network_comm",
   "name": "Interfaces Réseau & Sans-Fil",
   "kind": "communication",
   "components": [
    1,
    8,
    22,
    23
   ],
   "status": "ok",
   "note": "Double contrôleur/magnétique RJ45 Fly Core, transceivers PHY et module radio Wi-Fi/BT"
  },
  {
   "id": "usb_debug",
   "name": "Connectique USB, MicroSD & Débogage",
   "kind": "interface",
   "components": [
    9,
    10,
    13,
    24
   ],
   "status": "ok",
   "note": "Port USB-A hôte, port USB-C debug/série, contrôleur associé et slot MicroSD"
  },
  {
   "id": "io_expansion",
   "name": "Extensions I/O, Écran & Caméra",
   "kind": "interface",
   "components": [
    5,
    6,
    11,
    14,
    19,
    21
   ],
   "status": "ok",
   "note": "Headers GPIO, connecteurs FPC MIPI (DSI/CSI), cavaliers de boot et bouton poussoir"
  },
  {
   "id": "passives",
   "name": "Passifs de découplage et adaptation",
   "kind": "passive",
   "components": [
    16,
    18,
    20,
    28,
    29
   ],
   "status": "ok",
   "note": "Réseaux de résistances et condensateurs de filtrage/terminaison répartis"
  }
 ],
 "connections": [
  {
   "from": "power_mgmt",
   "to": "soc_proc",
   "signal": "VIN / VDD_CORE / 3V3 / 1V8",
   "type": "power"
  },
  {
   "from": "power_mgmt",
   "to": "memory",
   "signal": "VDD_MEM / 1V2_1V8",
   "type": "power"
  },
  {
   "from": "power_mgmt",
   "to": "network_comm",
   "signal": "3V3",
   "type": "power"
  },
  {
   "from": "power_mgmt",
   "to": "usb_debug",
   "signal": "5V / 3V3",
   "type": "power"
  },
  {
   "from": "power_mgmt",
   "to": "io_expansion",
   "signal": "3V3 / VDD_EXT",
   "type": "power"
  },
  {
   "from": "soc_proc",
   "to": "memory",
   "signal": "BUS MEM (DDR / eMMC CMD-CLK-DA",
   "type": "data"
  },
  {
   "from": "soc_proc",
   "to": "network_comm",
   "signal": "RGMII / RMII / SDIO / UART",
   "type": "data"
  },
  {
   "from": "soc_proc",
   "to": "usb_debug",
   "signal": "USB D+/D- / SDIO / UART DEBUG",
   "type": "data"
  },
  {
   "from": "soc_proc",
   "to": "io_expansion",
   "signal": "GPIO / MIPI CSI-DSI / I2C / SP",
   "type": "data"
  },
  {
   "from": "passives",
   "to": "soc_proc",
   "signal": "DECOUPLING / PULL-UP",
   "type": "ground"
  }
 ],
 "notes": [
  "Architecture fonctionnelle d'une SBC industrielle avec module SoM soudé ou intégré (processeur Forlinx).",
  "Toutes les liaisons internes (rails d'alimentation PMIC et bus mémoire haute vitesse) sont déduites d'après les standards d'architecture applicative ARM/SoC.",
  "Aucune anomalie visuelle constatée sur les composants listés (tous marqués OK)."
 ]
} as Schematic;
