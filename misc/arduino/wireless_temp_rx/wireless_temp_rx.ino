#include <RF24.h>

const uint16_t CEPIN = 7;  // The pin attached to Chip Enable on the RF module
const uint16_t CSPIN = 8;  // The pin attached to Chip Select (often labeled CSN) on the radio module.

RF24 radio(CEPIN, CSPIN);
uint8_t pipes[][6] = {"prime", "niban", "3xxxx", "4xxxx", "5xxxx", "6xxxx"};
const char* pa_levels[4] = { "MIN", "LOW", "HIGH", "MAX" };
const char* data_rates[3] = { "1MBPS", "2MBPS", "250KBPS" };

void setup(void) {
  Serial.begin(9600);
  Serial.print(F("\nWireless Temp RX\n"));

  if (radio.begin()) {

    // higher channels are less busy
    Serial.print(F("radio channel: "));
    Serial.println(radio.getChannel());
    radio.setChannel(106);
    Serial.print(F("radio channel: "));
    Serial.println(radio.getChannel());

    // higher sensitivity at lower speeds
    Serial.print(F("radio data rate: "));
    Serial.println(data_rates[radio.getDataRate()]);
    if (radio.isPVariant() && radio.setDataRate(RF24_250KBPS))
      Serial.println(F("radio data rate: reduced"));
    else
      Serial.println(F("radio data rate: could't reduce (available on nRF24L01+ only)"));
    Serial.print(F("radio data rate: "));
    Serial.println(data_rates[radio.getDataRate()]);

    radio.openReadingPipe(1, pipes[0]);
    radio.startListening();
  } else {
    Serial.println(F("radio hardware not responding!"));
    while (1) {} // hold program in infinite loop to prevent subsequent errors
  }
  
  Serial.println("Listening.....");
}

void loop(void)
{
  if (radio.available()) {
    float temp = -1;
    radio.read(&temp, sizeof(temp));
    
    Serial.print("Received: ");
    Serial.println(temp);
    delay(100);
  }
}
