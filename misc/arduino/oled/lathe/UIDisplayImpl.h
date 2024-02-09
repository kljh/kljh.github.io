#pragma once
#include "UIDisplayInterface.h"
#include <SPI.h>
#include <Wire.h>

// #define USE_U8X8
#define USE_ADAFRUIT

// U8X8
#ifdef USE_U8X8
#include <U8x8lib.h>
#endif

// Adafruit
#ifdef USE_ADAFRUIT
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#endif


#ifdef USE_U8X8

class UIDisplayU8x8 : public UIDisplayInterface
{
public:
	UIDisplayU8x8(U8X8& u8x8);
	virtual void clear() override;
	virtual void print(const char *txt, int row = 0, int col = 0, int txtsize = 1, int inverse = 0) override;
	virtual void display() override;
private:
	U8X8& u8x8;
};

#endif

#ifdef USE_ADAFRUIT

class UIDisplayAdafruit : public UIDisplayInterface
{
public:
	UIDisplayAdafruit(Adafruit_SH1106G& oled, int i2c_Address);
	virtual void clear() override;
	virtual void print(const char *txt, int row = 0, int col = 0, int txtsize = 1, int inverse = 0) override;
	virtual void display() override;
private:
	Adafruit_SH110X& oled;
};

#endif
