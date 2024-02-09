
// Library dependency:
// - OLED i2C display : u8g2
// - Rotary encoder : http://www.mathertel.de/Arduino/RotaryEncoderLibrary.aspx

#include <Arduino.h>
#include "RotaryEncoder.h"
#include "StepperMotor.h"
#include "UIDisplayImpl.h"
#include "UILathe.h"

// UIRoot
UIRoot* uiroot = nullptr;


#ifdef USE_U8X8

// U8x8 Contructor
// The complete list is available here: https://github.com/olikraus/u8g2/wiki/u8x8setupcpp
// I2C is connected on PIN_A4=I2C_SDA, PIN_A5=I2C_SCL
// 128x64 = 16 cols x 8 rows of 8x8 characters
U8X8_SH1106_128X64_NONAME_HW_I2C u8x8(/* reset=*/ U8X8_PIN_NONE);

#endif

#ifdef USE_ADAFRUIT

#define i2c_Address 0x3c //initialize with the I2C addr 0x3C Typically eBay OLED's
//#define i2c_Address 0x3d //initialize with the I2C addr 0x3D Typically Adafruit OLED's

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET -1   //   QT-PY / XIAO
Adafruit_SH1106G adafruitOled = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#endif


// Digital pins usable for interrupts
// ATMega328 : digital 2 and 3 only
// ATMega2560 : digital 2, 3 (X+/X- limit switches), 18, 19 (Z-/Z+ limit switches), 20, 21 (used by I2)
#if defined(ARDUINO_AVR_UNO) || defined(ARDUINO_AVR_NANO_EVERY)
#define PIN_ROTARY_ENCODER_INT1 2
#define PIN_ROTARY_ENCODER_INT2 3
#elif defined(ARDUINO_AVR_MEGA2560)
#define PIN_ROTARY_ENCODER_INT1 2
#define PIN_ROTARY_ENCODER_INT2 3
#else
#error Board not configured
#endif


RotaryEncoder *encoder = nullptr;

// Interrupt routine will be called on any change of one of the rotary encoder signals
void checkPosition()
{
  // refreshDisplay(-2);
  encoder->tick(); // just call tick() to check the state.
}

static bool bFirstIteration = true;
static bool bVerboseSerial = true;

void setup(void)
{
  Serial.begin(9600);

  delay(500);

  if (bVerboseSerial)
    Serial.println("Rotary button begin");

  // LatchModes : FOUR3 (pin signals are both HIGH in latch position), TWO03 (pin signals are both LOW or both HIGH in latch position)
  encoder = new RotaryEncoder(PIN_ROTARY_ENCODER_INT1, PIN_ROTARY_ENCODER_INT2, RotaryEncoder::LatchMode::FOUR3);
  encoder->tick(); // just call tick() to check the state.

  // register interrupt routine
  // attachInterrupt(digitalPinToInterrupt(PIN_ROTARY_ENCODER_INT1), checkPosition, CHANGE);
  // attachInterrupt(digitalPinToInterrupt(PIN_ROTARY_ENCODER_INT2), checkPosition, CHANGE);

  // pinMode(Z_MIN, INPUT);
  // pinMode(Z_MAX, INPUT);

  if (bVerboseSerial)
    Serial.println("Stepper begin");
  StepperMotorsInit();

  if (bVerboseSerial)
    Serial.println("UI begin");
#ifdef USE_U8X8
  static UIDisplayU8x8 display(u8x8);
#endif
#ifdef USE_ADAFRUIT
  static UIDisplayAdafruit display(adafruitOled, i2c_Address);
#endif
  uiroot = new UIRoot(display);

  Serial.println("InitLatheUI begin");
  InitLatheUI(*uiroot, nullptr);


  if (bVerboseSerial)
    Serial.println("init end");
}


void loop(void)
{
  if (bVerboseSerial)
    Serial.println("loop begin");

  if (bFirstIteration) {
    // display.clear();
    // display.print("Init Lathe UI");
    // display.display();

    int rotaryPosition = encoder->getPosition();
    uiroot->UpdateUI(rotaryPosition, digitalRead(Z_MIN), digitalRead(Z_MAX), true);
    bFirstIteration = false;
  }

  static int pos = 0;
  encoder->tick(); // just call tick() to check the state.
  int newPos = encoder->getPosition();
  int dir = (int)encoder->getDirection();

  if (pos != newPos) {
    // refreshDisplay(newPos);
    pos = newPos;
  }
  uiroot->UpdateUI(newPos, digitalRead(Z_MIN), digitalRead(Z_MAX));

  // delay(500);

  if (bVerboseSerial)
    Serial.println("loop end");
  bVerboseSerial = false;
}



// To use other pins with Arduino UNO you can also use the ISR directly.
// Here is some code for A2 and A3 using ATMega168 ff. specific registers.

// Setup flags to activate the ISR PCINT1.
// You may have to modify the next 2 lines if using other pins than A2 and A3
//   PCICR |= (1 << PCIE1);    // This enables Pin Change Interrupt 1 that covers the Analog input pins or Port C.
//   PCMSK1 |= (1 << PCINT10) | (1 << PCINT11);  // This enables the interrupt for pin 2 and 3 of Port C.

// The Interrupt Service Routine for Pin Change Interrupt 1
// This routine will only be called on any signal change on A2 and A3.
// ISR(PCINT1_vect) {
//   encoder->tick(); // just call tick() to check the state.
// }
