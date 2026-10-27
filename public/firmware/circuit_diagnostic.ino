/* CircuitDiag — lecture de tension continue sur cartes Arduino ATMEL 5 V.
 *
 * Le code s'adapte a la carte selectionnee dans Arduino IDE :
 *   Arduino Nano classique ATmega328P ......... A0-A7    CH1-CH8
 *   Arduino Uno / Duemilanove / Pro Mini 328P . A0-A5    CH1-CH6
 *   Arduino Mega ATmega2560 ................... A0-A15   CH1-CH16
 *
 * Les autres cartes sont refusees a la compilation (message "Carte nonprise en
 * charge") : ESP32, ESP32 DevKit V1, Nano ESP32, Due, Zero, MKR, UNO Q
 * (Qualcomm), cartes RP2040. Elles fonctionnent en 3,3 V, avec un convertisseur
 * et un brochage differents : ne pas les forcer.
 *
 * Mesure uniquement la tension continue. Aucune mesure de resistance,
 * de continuite ni detection automatique de composant defectueux.
 *
 * Premiere verification: 2 piles AA, negatif -> GND,
 * positif -> resistance 1 kohm -> A0 (CH1). USB alimente la carte.
 * La resistance 1 kohm NE protege PAS contre une surtension.
 * Jamais de secteur, tension negative ou tension > 5 V / > VREF.
 *
 * Ne pas connecter une carte inconnue. Ne pas alimenter la carte par l'Arduino.
 *
 * 115200 bauds, commandes SCAN / STOP terminees par nouvelle ligne.
 * CSV: VOLTAGE,1,3.000,V,ok
 * "ok" = lecture transmise, PAS composant sain.
 * Une lecture proche de VREF peut etre saturee: verifier au multimetre.
 */

// --- Cartes refusees : tension de 3,3 V et convertisseur differents ---------
#if defined(ESP32) || defined(ARDUINO_ARCH_SAM) || defined(ARDUINO_ARCH_SAMD) || defined(ARDUINO_ARCH_RP2040) || defined(ARDUINO_ARCH_MBED)
#error "Carte nonprise en charge (ESP32, Due, Zero, MKR, Nano ESP32, UNO Q). Utiliser une carte ATMEL 5V: Nano, Uno ou Mega."
#endif

// --- Entrees et canaux selon la carte choisie dans Arduino IDE --------------
#if defined(ARDUINO_AVR_NANO)
  #define CD_BOARD "Nano328"
  const uint8_t CHANNELS[] = {A0, A1, A2, A3, A4, A5, A6, A7};
  // Activer uniquement les entrees physiquement connectees.
  // Par defaut: CH1 / A0 seulement. Ne pas lire les entrees flottantes.
  const bool CHANNEL_ENABLED[] = {true, false, false, false, false, false, false, false};
#elif defined(__AVR_ATmega328P__)
  // Uno, Duemilanove, Pro Mini et autres cartes ATmega328P : pas de A6/A7.
  #define CD_BOARD "Uno328"
  const uint8_t CHANNELS[] = {A0, A1, A2, A3, A4, A5};
  const bool CHANNEL_ENABLED[] = {true, false, false, false, false, false};
#elif defined(__AVR_ATmega2560__)
  #define CD_BOARD "Mega2560"
  const uint8_t CHANNELS[] = {A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15};
  const bool CHANNEL_ENABLED[] = {true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false};
#else
  #error "Carte nonprise en charge : choisir Arduino Nano, Uno ou Mega (ATmega328P / ATmega2560)."
#endif

const uint8_t NUM_CHANNELS = sizeof(CHANNELS) / sizeof(CHANNELS[0]);

// Remplacer par la tension mesuree entre 5V et GND de la carte alimentee en USB.
const float VREF = 5.000;
const uint16_t ADC_MAX = 1023;
const uint8_t SAMPLE_COUNT = 16;
const unsigned long SCAN_INTERVAL_MS = 500;

bool scanning = false;
char commandBuffer[16];
uint8_t commandLength = 0;
bool commandOverflow = false;
unsigned long lastScan = 0;

void setup() {
  Serial.begin(115200);
  analogReference(DEFAULT);
  Serial.print("READY,CircuitDiag,");
  Serial.println(CD_BOARD);
}

void readCommands() {
  while (Serial.available() > 0) {
    const char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      commandBuffer[commandLength] = '\0';
      if (!commandOverflow && strcmp(commandBuffer, "SCAN") == 0) {
        scanning = true;
        lastScan = millis() - SCAN_INTERVAL_MS;
      } else if (!commandOverflow && strcmp(commandBuffer, "STOP") == 0) {
        scanning = false;
      }
      commandLength = 0;
      commandOverflow = false;
    } else if (commandLength < sizeof(commandBuffer) - 1) {
      commandBuffer[commandLength++] = c;
    } else {
      commandOverflow = true;
    }
  }
}

void scanChannels() {
  for (uint8_t i = 0; i < NUM_CHANNELS; i++) {
    if (!CHANNEL_ENABLED[i]) continue;
    analogRead(CHANNELS[i]); // Lecture ignoree apres changement de canal.
    unsigned long sum = 0;
    for (uint8_t s = 0; s < SAMPLE_COUNT; s++) {
      sum += analogRead(CHANNELS[i]);
      delayMicroseconds(200);
    }
    const float voltage = (sum / (float)SAMPLE_COUNT) * VREF / ADC_MAX;
    Serial.print("VOLTAGE,");
    Serial.print(i + 1);
    Serial.print(',');
    Serial.print(voltage, 3);
    Serial.println(",V,ok");
  }
}

void loop() {
  readCommands();
  if (scanning && millis() - lastScan >= SCAN_INTERVAL_MS) {
    lastScan = millis();
    scanChannels();
  }
}
