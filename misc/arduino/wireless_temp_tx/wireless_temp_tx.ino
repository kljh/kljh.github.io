/*

Ref:
https://github.com/nRF24/RF24

*/

#include <RF24.h>
// #include <BTLE.h>  //  Bluetooth Low Energy support using the nRF24L01+ (basic support = sending & receiving on the advertising broadcast channel)

#include <OneWire.h>
#include <DallasTemperature.h>

const uint8_t  ONE_WIRE_BUS = 2;
const uint16_t CEPIN = 7;  // The pin attached to Chip Enable on the RF module
const uint16_t CSPIN = 8;  // The pin attached to Chip Select (often labeled CSN) on the radio module.


OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

RF24 radio(CEPIN, CSPIN);
uint8_t pipes[][6] = {"prime", "niban", "3xxxx", "4xxxx", "5xxxx", "6xxxx"};

float temp = 0.0;

void setup(void) {
  Serial.begin(9600);
  
  if (radio.begin()) {
    radio.openWritingPipe(pipes[0]);
    radio.stopListening();
  } else {
    Serial.println(F("radio hardware not responding!"));
    while (1) {} // hold program in infinite loop to prevent subsequent errors
  }
    
  sensors.begin();
}

void loop(void)
{
  sensors.requestTemperatures();
  float temperature = sensors.getTempCByIndex(0);
  
  bool ack = radio.write(&temp, sizeof(temp));
  Serial.println(ack ? F("sent & acknowledged with an ACK packet") : F("sent but NOT acknowledged with an ACK packet"));
  
  delay(1000);
}
