/*

Ref:
https://github.com/nRF24/RF24

*/

#include <RF24.h>

#include <OneWire.h>
#include <DallasTemperature.h>

const uint8_t  ONE_WIRE_BUS = 3;
const uint16_t CEPIN = 7;  // The pin attached to Chip Enable on the RF module
const uint16_t CSPIN = 8;  // The pin attached to Chip Select (often labeled CSN) on the radio module.


OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

RF24 radio(CEPIN, CSPIN);
const uint8_t pipes[][6] = {"prime", "niban", "3xxxx", "4xxxx", "5xxxx", "6xxxx"};
const char* pa_levels[4] = { "MIN", "LOW", "HIGH", "MAX" };
const char* data_rates[3] = { "1MBPS", "2MBPS", "250KBPS" };

void setup(void) {
  Serial.begin(9600);
  Serial.print(F("\nWireless Temp TX\n"));

  sensors.begin();
  
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

    Serial.print(F("radio power level: "));
    Serial.println(pa_levels[radio.getPALevel()]);
    // radio.setPALevel(RF24_PA_HIGH);

    radio.openWritingPipe(pipes[0]);
    radio.stopListening();
  } else {
    Serial.println(F("radio hardware not responding!"));
    while (1) {} // hold program in infinite loop to prevent subsequent errors
  }
}

void loop(void)
{
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);
  
  bool ack = radio.write(&temp, sizeof(temp));
  Serial.println(ack ? F("sent & acknowledged with an ACK packet") : F("sent but NOT acknowledged with an ACK packet"));
  
  delay(1000);
}
