#include <SPI.h>
#include <RF24.h>
#include <BTLE.h>

#include <OneWire.h>
#include <DallasTemperature.h>

// nRF Connect for Mobile by Nordic Semiconductor ASA on Android Play Store

const uint8_t  ONE_WIRE_BUS = 3;
const uint16_t CEPIN = 7;  // The pin attached to Chip Enable on the RF module
const uint16_t CSPIN = 8;  // The pin attached to Chip Select (often labeled CSN) on the radio module.

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

RF24 radio(CEPIN, CSPIN);
BTLE btle(&radio);

void setup() {
  Serial.begin(9600);
  while (!Serial) { }
  Serial.print(F("\nWireless Temp BLTE TX\n"));

  Serial.println("Begin sensors.");
  sensors.begin();

  Serial.println("Begin BTLE advertisement sender");
  btle.begin("BTEMP");
}

void loop() {
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);

  nrf_service_data buf;
  //buf.service_uuid = NRF_DEVICE_INFORMATION_SERVICE_UUID;  // 0x180A
  //buf.service_uuid = NRF_BATTERY_SERVICE_UUID;  // 0x180F
  buf.service_uuid = NRF_TEMPERATURE_SERVICE_UUID;  // 0x1809
  buf.value = BTLE::to_nRF_Float(temp);
  btle.advertise(0x16, &buf, sizeof(buf));
  btle.hopChannel();
  Serial.print(".");
}
