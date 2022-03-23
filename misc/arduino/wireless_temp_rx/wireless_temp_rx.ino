#include <RF24.h>

const uint16_t CEPIN = 7;  // The pin attached to Chip Enable on the RF module
const uint16_t CSPIN = 8;  // The pin attached to Chip Select (often labeled CSN) on the radio module.

RF24 radio(CEPIN, CSPIN);
uint8_t pipes[][6] = {"prime", "niban", "3xxxx", "4xxxx", "5xxxx", "6xxxx"};


void setup(void) {
  Serial.begin(9600);

  if (radio.begin()) {
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
