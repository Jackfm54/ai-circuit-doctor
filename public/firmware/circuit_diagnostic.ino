/* CircuitDiag — Arduino Nano classique ATmega328P, 5 V / 16 MHz.
 * PAS compatible ESP32, Nano ESP32 ou UNO Q.
 * Mesure uniquement la tension continue. Aucune mesure de resistance,
 * de continuite ni detection automatique de composant defectueux.
 *
 * Premiere verification: 2 piles AA, negatif -> GND,
 * positif -> resistance 1 kohm -> A0. USB alimente la Nano.
 * La resistance 1 kohm NE protege PAS contre une surtension.
 * Jamais de secteur, tension negative ou tension > 5 V / > VREF.
 * Ne pas connecter une carte inconnue. Ne pas alimenter la carte par la Nano.
 * D2-D5 restent inutilises; aucun INPUT_PULLUP sur la carte testee.
 *
 * 115200 bauds, commandes SCAN / STOP terminees par nouvelle ligne.
 * CSV: VOLTAGE,1,3.000,V,ok
 * "ok" = lecture transmise, PAS composant sain.
 * Une lecture proche de VREF peut etre saturee: verifier au multimetre.
 */

const uint8_t CHANNELS[] = {A0, A1, A2, A3, A4, A5, A6, A7};
// Activer uniquement les entrees physiquement connectees.
// Par defaut: CH1 / A0 seulement. Ne pas lire les entrees flottantes.
const bool CHANNEL_ENABLED[] = {true, false, false, false, false, false, false, false};
const uint8_t NUM_CHANNELS = 8;
// Remplacer par la tension mesuree entre 5V et GND de la Nano alimentee en USB.
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
  Serial.println("READY,CircuitDiag,Nano-DC-2.0");
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
