#include "UIDisplayImpl.h"

#ifdef USE_U8X8

// u8x8_font_chroma48medium8_r
// u8x8_font_inb21_2x4_r
#define FONT_8x8      u8x8_font_amstrad_cpc_extended_r
#define FONT_16x24    u8x8_font_profont29_2x3_r
#define FONT_24x48    u8x8_font_inb33_3x6_n

UIDisplayU8x8::UIDisplayU8x8(U8X8& u8x8)
	: u8x8(u8x8)
{
	u8x8.begin();
	u8x8.setPowerSave(0);  // disable powersave. if enabled, nothing is displayed
}

void UIDisplayU8x8::clear()
{
	// not needed if we write over
	u8x8.clear();
	u8x8.clearDisplay();
	for (int i=0; i<8; i++)
		u8x8.drawString(0, i, "                ");
}

void UIDisplayU8x8::display()
{
	// u8x8.refreshDisplay();  // only required for SSD1606/7
}

void UIDisplayU8x8::print(const char *txt, int row, int col, int txtsize, int inverse)
{
	if (inverse)
		u8x8.setInverseFont(1);

	u8x8.setFont(FONT_8x8);  // 8x8 font
	if (txtsize==4) {
		u8x8.setFont(FONT_24x48);
		u8x8.drawString(col, row, txt);
		u8x8.setFont(FONT_8x8);
	}
	else if (txtsize==3) {
		u8x8.setFont(FONT_16x24);
		u8x8.drawString(col, row, txt);
		u8x8.setFont(FONT_8x8);
	} else if (txtsize==2)
		u8x8.draw1x2String(col, row, txt);
	else
		u8x8.drawString(col, row, txt);

	if (inverse)
		u8x8.setInverseFont(0);
}

#endif

#ifdef USE_ADAFRUIT

UIDisplayAdafruit::UIDisplayAdafruit(Adafruit_SH1106G& oled, int i2c_Address)
	: oled(oled)
{
  delay(250); // wait for the OLED to power up
  oled.begin(i2c_Address, true); // Address 0x3C default
  oled.display();  // splash screen
  
  delay(500);
  oled.clearDisplay();
  oled.display();

  //display.setRotation(1);
  
  // text display tests
  oled.setTextSize(1);
  oled.setTextColor(SH110X_WHITE);
  oled.setCursor(0,0);
  oled.print("Lathe ");
  oled.println("Oled ");
  oled.println("Init");
  
  oled.setTextSize(1);
  oled.setTextColor(SH110X_WHITE, SH110X_BLACK);
  oled.setCursor(3,0);
  oled.print("3 ");
  
  oled.setCursor(0,5);
  oled.print("5");
  
  oled.display(); // actually display all of the above

  delay(5000);
  oled.clearDisplay();
}

void UIDisplayAdafruit::clear()
{
	  oled.clearDisplay();
}

void UIDisplayAdafruit::display()
{
	  oled.display();
}

void UIDisplayAdafruit::print(const char *txt, int row, int col, int txtsize, int inverse)
{
	if (txtsize != 1)
		oled.setTextSize(txtsize);
	if (inverse)
		oled.setTextColor(SH110X_BLACK, SH110X_WHITE); // 'inverted' text

  oled.setCursor(col*8, row*8);
  oled.println(txt);

	if (txtsize != 1)
		oled.setTextSize(1);
	if (inverse)
		oled.setTextColor(SH110X_WHITE, SH110X_BLACK);
}

#endif
