/*
 * Circuit Diagnostic - Firmware pour Arduino Nano / ESP32
 * Envoie des mesures REELLES au programme via le port serie USB.
 *
 * Protocole (115200 bauds, une ligne CSV par mesure):
 *   TYPE,CANAL,VALEUR,UNITE,STATUT
 *   Exemple: VOLTAGE,1,3.32,V,ok
 *
 * Commandes recues du programme:
 *   SCAN  -> demarre l'envoi continu des mesures
 *   STOP  -> arrete l'envoi
 *
 * Cablage (Arduino Nano):
 *   A0..A5 -> points de test de la carte (via pointes de mesure)
 *   GND    -> masse de la carte testee (OBLIGATOIRE, reference commune)
 *
 * ATTENTION: ne jamais depasser 5V sur une entree du Nano (3.3V sur ESP32).
 * Ne mesurez que des circuits basse tension. Jamais le secteur 120V.
 */

const int CHANNELS[] = {A0, A1, A2, A3, A4, A5};
const int NUM_CHANNELS = 6;
const float VREF = 5.0;          // 3.3 pour ESP32
const int ADC_MAX = 1023;        // 4095 pour ESP32

bool scanning = false;
String inputBuffer = "";

void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }
  Serial.println("READY,CircuitDiagnostic,1.0");
}

void loop() {
  // Lire les commandes du programme
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      inputBuffer.trim();
      if (inputBuffer == "SCAN") scanning = true;
      else if (inputBuffer == "STOP") scanning = false;
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }

  if (scanning) {
    for (int i = 0; i < NUM_CHANNELS; i++) {
      // Moyenne de 16 lectures pour reduire le bruit
      long sum = 0;
      for (int s = 0; s < 16; s++) {
        sum += analogRead(CHANNELS[i]);
        delayMicroseconds(200);
      }
      float voltage = (sum / 16.0) * VREF / ADC_MAX;

      // Statut selon plages typiques d'alimentation
      const char* status = "ok";
      if (voltage > VREF * 0.98) status = "error";        // proche du rail = possible court-circuit
      else if (voltage < 0.05) status = "warning";        // pas de tension = ligne morte ou point flottant

      Serial.print("VOLTAGE,");
      Serial.print(i + 1);
      Serial.print(",");
      Serial.print(voltage, 2);
      Serial.print(",V,");
      Serial.println(status);
    }
    delay(500); // 2 balayages par seconde
  }
}
