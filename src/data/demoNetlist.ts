// Real generate-schematic (detailed) output for the demo board (FR), stored for offline classroom demos.
import type { Netlist } from "@/components/NetlistSchematic";

export const demoNetlistFr: Netlist = {
 "title": "Schématique extrait - Carte SBC Forlinx",
 "parts": [
  {
   "component": 1,
   "designator": "J1",
   "symbol": "connector",
   "label": "Fly Core FC-202GYDNL RJ45 Dual",
   "pins": [
    {
     "name": "TX+",
     "net": "ETH_TXP"
    },
    {
     "name": "TX-",
     "net": "ETH_TXN"
    },
    {
     "name": "RX+",
     "net": "ETH_RXP"
    },
    {
     "name": "RX-",
     "net": "ETH_RXN"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "SHIELD",
     "net": "GND"
    }
   ]
  },
  {
   "component": 2,
   "designator": "U2",
   "symbol": "ic",
   "label": "DRAM / RAM Memory",
   "pins": [
    {
     "name": "VDD",
     "net": "1V8"
    },
    {
     "name": "VSS",
     "net": "GND"
    },
    {
     "name": "ADDR",
     "net": "DRAM_ADDR"
    },
    {
     "name": "DQ",
     "net": "DRAM_DATA"
    }
   ]
  },
  {
   "component": 3,
   "designator": "U1",
   "symbol": "ic",
   "label": "SoC Main Processor",
   "pins": [
    {
     "name": "VDD_CORE",
     "net": "VCORE"
    },
    {
     "name": "VDD_IO",
     "net": "3V3"
    },
    {
     "name": "VDD_DDR",
     "net": "1V8"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "ETH_TXP",
     "net": "ETH_TXP"
    },
    {
     "name": "ETH_RXP",
     "net": "ETH_RXP"
    },
    {
     "name": "USB_DP",
     "net": "USB_DP"
    },
    {
     "name": "USB_DM",
     "net": "USB_DM"
    },
    {
     "name": "MIPI_DP",
     "net": "MIPI_D0P"
    },
    {
     "name": "MIPI_DN",
     "net": "MIPI_D0N"
    },
    {
     "name": "SDIO_CLK",
     "net": "SDIO_CLK"
    },
    {
     "name": "RESET_N",
     "net": "RESET"
    }
   ]
  },
  {
   "component": 4,
   "designator": "J2",
   "symbol": "connector",
   "label": "DC Power Jack",
   "pins": [
    {
     "name": "VIN",
     "net": "VIN"
    },
    {
     "name": "GND",
     "net": "GND"
    }
   ]
  },
  {
   "component": 5,
   "designator": "J3",
   "symbol": "connector",
   "label": "Expansion Header Left",
   "pins": [
    {
     "name": "5V",
     "net": "5V"
    },
    {
     "name": "3V3",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "GPIO1",
     "net": "GPIO_EXT1"
    },
    {
     "name": "GPIO2",
     "net": "GPIO_EXT2"
    }
   ]
  },
  {
   "component": 6,
   "designator": "J4",
   "symbol": "connector",
   "label": "GPIO Header Right",
   "pins": [
    {
     "name": "3V3",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "GPIO1",
     "net": "GPIO_EXT1"
    },
    {
     "name": "GPIO2",
     "net": "GPIO_EXT2"
    }
   ]
  },
  {
   "component": 7,
   "designator": "U3",
   "symbol": "ic",
   "label": "eMMC Flash Memory",
   "pins": [
    {
     "name": "VCC",
     "net": "3V3"
    },
    {
     "name": "VCCQ",
     "net": "1V8"
    },
    {
     "name": "VSS",
     "net": "GND"
    },
    {
     "name": "CLK",
     "net": "SDIO_CLK"
    },
    {
     "name": "CMD",
     "net": "SDIO_CMD"
    },
    {
     "name": "D0",
     "net": "SDIO_D0"
    }
   ]
  },
  {
   "component": 8,
   "designator": "U4",
   "symbol": "ic",
   "label": "Wi-Fi / BT Wireless Module",
   "pins": [
    {
     "name": "VBAT",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "ANT",
     "net": "RF_ANT"
    },
    {
     "name": "SDIO_CLK",
     "net": "SDIO_CLK"
    },
    {
     "name": "SDIO_CMD",
     "net": "SDIO_CMD"
    },
    {
     "name": "SDIO_DAT0",
     "net": "SDIO_D0"
    }
   ]
  },
  {
   "component": 9,
   "designator": "J5",
   "symbol": "connector",
   "label": "USB Type-A Connector",
   "pins": [
    {
     "name": "VBUS",
     "net": "5V"
    },
    {
     "name": "D-",
     "net": "USB_DM"
    },
    {
     "name": "D+",
     "net": "USB_DP"
    },
    {
     "name": "GND",
     "net": "GND"
    }
   ]
  },
  {
   "component": 10,
   "designator": "U5",
   "symbol": "ic",
   "label": "Interface Controller U26",
   "pins": [
    {
     "name": "VCC",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "TX",
     "net": "DBG_TX"
    },
    {
     "name": "RX",
     "net": "DBG_RX"
    }
   ]
  },
  {
   "component": 11,
   "designator": "J6",
   "symbol": "connector",
   "label": "FPC Display/Camera Connector",
   "pins": [
    {
     "name": "VCC",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "D0P",
     "net": "MIPI_D0P"
    },
    {
     "name": "D0N",
     "net": "MIPI_D0N"
    }
   ]
  },
  {
   "component": 12,
   "designator": "U6",
   "symbol": "ic",
   "label": "PMIC Power Management IC",
   "pins": [
    {
     "name": "VIN",
     "net": "VIN"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "OUT_5V",
     "net": "5V"
    },
    {
     "name": "OUT_3V3",
     "net": "3V3"
    },
    {
     "name": "OUT_1V8",
     "net": "1V8"
    },
    {
     "name": "OUT_VCORE",
     "net": "VCORE"
    }
   ]
  },
  {
   "component": 13,
   "designator": "J7",
   "symbol": "connector",
   "label": "MicroSD Card Slot",
   "pins": [
    {
     "name": "VDD",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "CLK",
     "net": "SDIO_CLK"
    },
    {
     "name": "CMD",
     "net": "SDIO_CMD"
    },
    {
     "name": "DAT0",
     "net": "SDIO_D0"
    }
   ]
  },
  {
   "component": 14,
   "designator": "SW1",
   "symbol": "switch",
   "label": "Push Button / Reset Switch",
   "pins": [
    {
     "name": "1",
     "net": "RESET"
    },
    {
     "name": "2",
     "net": "GND"
    }
   ]
  },
  {
   "component": 15,
   "designator": "C1",
   "symbol": "capacitor",
   "label": "MLCC Input Decoupling",
   "pins": [
    {
     "name": "1",
     "net": "VIN"
    },
    {
     "name": "2",
     "net": "GND"
    }
   ]
  },
  {
   "component": 16,
   "designator": "C2",
   "symbol": "capacitor",
   "label": "MLCC Decoupling",
   "pins": [
    {
     "name": "1",
     "net": "3V3"
    },
    {
     "name": "2",
     "net": "GND"
    }
   ]
  },
  {
   "component": 17,
   "designator": "C3",
   "symbol": "capacitor",
   "label": "MLCC Power Rail Cap",
   "pins": [
    {
     "name": "1",
     "net": "5V"
    },
    {
     "name": "2",
     "net": "GND"
    }
   ]
  },
  {
   "component": 18,
   "designator": "R1",
   "symbol": "resistor",
   "label": "Pull-up Resistor",
   "pins": [
    {
     "name": "1",
     "net": "3V3"
    },
    {
     "name": "2",
     "net": "SDIO_CMD"
    }
   ]
  },
  {
   "component": 19,
   "designator": "J8",
   "symbol": "connector",
   "label": "Config Jumper Header",
   "pins": [
    {
     "name": "1",
     "net": "3V3"
    },
    {
     "name": "2",
     "net": "GPIO_EXT1"
    }
   ]
  },
  {
   "component": 20,
   "designator": "R2",
   "symbol": "resistor",
   "label": "Termination Resistor",
   "pins": [
    {
     "name": "1",
     "net": "3V3"
    },
    {
     "name": "2",
     "net": "RESET"
    }
   ]
  },
  {
   "component": 21,
   "designator": "J9",
   "symbol": "connector",
   "label": "MIPI CSI/DSI FPC Connector",
   "pins": [
    {
     "name": "CLKP",
     "net": "MIPI_CLKP"
    },
    {
     "name": "CLKN",
     "net": "MIPI_CLKN"
    },
    {
     "name": "D0P",
     "net": "MIPI_D0P"
    },
    {
     "name": "D0N",
     "net": "MIPI_D0N"
    },
    {
     "name": "GND",
     "net": "GND"
    }
   ]
  },
  {
   "component": 22,
   "designator": "U7",
   "symbol": "ic",
   "label": "Ethernet PHY / Interface IC",
   "pins": [
    {
     "name": "VDD",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "TXP",
     "net": "ETH_TXP"
    },
    {
     "name": "TXN",
     "net": "ETH_TXN"
    },
    {
     "name": "RXP",
     "net": "ETH_RXP"
    },
    {
     "name": "RXN",
     "net": "ETH_RXN"
    }
   ]
  },
  {
   "component": 23,
   "designator": "U8",
   "symbol": "ic",
   "label": "Transceiver IC",
   "pins": [
    {
     "name": "VCC",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "TX",
     "net": "DBG_TX"
    },
    {
     "name": "RX",
     "net": "DBG_RX"
    }
   ]
  },
  {
   "component": 24,
   "designator": "J10",
   "symbol": "connector",
   "label": "USB Type-C Port DEBUG",
   "pins": [
    {
     "name": "VBUS",
     "net": "5V"
    },
    {
     "name": "GND",
     "net": "GND"
    },
    {
     "name": "DP",
     "net": "USB_DP"
    },
    {
     "name": "DM",
     "net": "USB_DM"
    }
   ]
  },
  {
   "component": 25,
   "designator": "C4",
   "symbol": "capacitor",
   "label": "MLCC Power Filter",
   "pins": [
    {
     "name": "1",
     "net": "VCORE"
    },
    {
     "name": "2",
     "net": "GND"
    }
   ]
  },
  {
   "component": 26,
   "designator": "U9",
   "symbol": "ic",
   "label": "Clock / Logic Buffer",
   "pins": [
    {
     "name": "VDD",
     "net": "3V3"
    },
    {
     "name": "GND",
     "net": "GND"
    }
   ]
  },
  {
   "component": 27,
   "designator": "C5",
   "symbol": "capacitor",
   "label": "MLCC Decoupling 1V8",
   "pins": [
    {
     "name": "1",
     "net": "1V8"
    },
    {
     "name": "2",
     "net": "GND"
    }
   ]
  },
  {
   "component": 28,
   "designator": "R3",
   "symbol": "resistor",
   "label": "Series Damping Resistor",
   "pins": [
    {
     "name": "1",
     "net": "SDIO_CLK"
    },
    {
     "name": "2",
     "net": "SDIO_CLK"
    }
   ]
  },
  {
   "component": 29,
   "designator": "C6",
   "symbol": "capacitor",
   "label": "MLCC Filter",
   "pins": [
    {
     "name": "1",
     "net": "3V3"
    },
    {
     "name": "2",
     "net": "GND"
    }
   ]
  }
 ],
 "nets": [
  {
   "name": "ETH_TXP",
   "kind": "signal"
  },
  {
   "name": "ETH_TXN",
   "kind": "signal"
  },
  {
   "name": "ETH_RXP",
   "kind": "signal"
  },
  {
   "name": "ETH_RXN",
   "kind": "signal"
  },
  {
   "name": "GND",
   "kind": "ground"
  },
  {
   "name": "1V8",
   "kind": "power"
  },
  {
   "name": "DRAM_ADDR",
   "kind": "signal"
  },
  {
   "name": "DRAM_DATA",
   "kind": "signal"
  },
  {
   "name": "VCORE",
   "kind": "power"
  },
  {
   "name": "3V3",
   "kind": "power"
  },
  {
   "name": "USB_DP",
   "kind": "signal"
  },
  {
   "name": "USB_DM",
   "kind": "signal"
  },
  {
   "name": "MIPI_D0P",
   "kind": "signal"
  },
  {
   "name": "MIPI_D0N",
   "kind": "signal"
  },
  {
   "name": "SDIO_CLK",
   "kind": "signal"
  },
  {
   "name": "RESET",
   "kind": "signal"
  },
  {
   "name": "VIN",
   "kind": "power"
  },
  {
   "name": "5V",
   "kind": "power"
  },
  {
   "name": "GPIO_EXT1",
   "kind": "signal"
  },
  {
   "name": "GPIO_EXT2",
   "kind": "signal"
  },
  {
   "name": "SDIO_CMD",
   "kind": "signal"
  },
  {
   "name": "SDIO_D0",
   "kind": "signal"
  },
  {
   "name": "RF_ANT",
   "kind": "signal"
  },
  {
   "name": "DBG_TX",
   "kind": "signal"
  },
  {
   "name": "DBG_RX",
   "kind": "signal"
  },
  {
   "name": "MIPI_CLKP",
   "kind": "signal"
  },
  {
   "name": "MIPI_CLKN",
   "kind": "signal"
  }
 ],
 "notes": [
  "Carte de développement Forlinx avec processeur embarqué, double connecteur Ethernet Fly Core, RAM LPDDR/DDR, stockage eMMC et module sans-fil.",
  "L'alimentation principale 5V/VIN est régulée localement par le PMIC vers 3V3, 1V8 et VCORE pour alimenter le SoC, la RAM et les périphériques.",
  "Les signaux haute vitesse MIPI, SDIO, Ethernet et USB sont distribués entre le SoC central et les connecteurs périphériques."
 ]
} as Netlist;
