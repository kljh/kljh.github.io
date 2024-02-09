
#include "UI.h"
#ifdef ARDUINO
#include <Arduino.h>
#else
#include <cstdio>
#endif

UIRoot::UIRoot(UIDisplayInterface& display)
	: display(display),
	rotaryPosition(0), buttonState(0), buttonState2(0),
	screen(nullptr)
{
}

void UIRoot::SwitchScreen(
	UIScreen *screenToDisplay)
{
	// new screen
	display.clear();

	if (screenToDisplay!=nullptr) {
		// move to next screen
		screenToDisplay->returnScreen = screen;
		screen = screenToDisplay;
	} else if (screen->returnScreen != nullptr) {
		// move back to previous screen
		screen = screen->returnScreen;
	}

	// force display update
	bool bForceUpdate = true;
	UpdateUI(rotaryPosition, buttonState, buttonState2, bForceUpdate);
}

char* intToTxt(int num);

// void displayBase(UIRoot& ui);

void displayRotary(
	UIDisplayInterface& display,
	int rotaryPosition,
	int buttonState,
	int buttonState2
);

void displaySelect(
	UIRoot& ui,
	UIDisplayInterface& display,
	UIScreenSelect& params,
	int incr,
	int click
);

void displayNumeric(
	UIRoot& ui,
	UIDisplayInterface& display,
	UIScreenNumeric& params,
	int incr,
	int click
);


void UIRoot::UpdateUI(
	int rotaryPosition,
	int buttonState,
	int buttonState2,
	bool bForceUpdate
	)
{

	if ((!bForceUpdate)
		&& this->rotaryPosition == rotaryPosition
		&& this->buttonState == buttonState
		&& this->buttonState2 == buttonState2
	) {
		// nothing to do
		return;
	}

	int incr = rotaryPosition - this->rotaryPosition;
	int click = buttonState - this->buttonState;

	// displayBase(display);

	switch (screen->screenType) {
		case Select:
			displaySelect(*this, display, (UIScreenSelect&)(*screen), incr, click);
			break;
		case Numeric:
			displayNumeric(*this, display, (UIScreenNumeric&)(*screen), incr, click);
			break;
		case Default:
		default:
			// displayRotary(ui.display, rotaryPosition, buttonState, buttonState2);
			break;
	}

	// Display for debug purpose
	displayRotary(display, rotaryPosition, buttonState, click);
	display.display();

	this->rotaryPosition = rotaryPosition;
	this->buttonState = buttonState;
	this->buttonState2 = buttonState2;
}

void displayBase(UIDisplayInterface& display)
{
	// display.clear();  // not needed if we write over

	display.print("Hello Menu !?$&%");
	display.print("0123456789012345", 1, 0, 1, 1);
	display.display();
}


void displayRotary(
	UIDisplayInterface& display,
	int rotaryPosition,
	int buttonState,
	int click
)
{
	// display.clear();

	// display.print("Rotary button");
	display.print(buttonState ? "H" : "L ", 0, 7);
	//display.print(buttonState2 ? "H" : "L ", 0, 8);
	display.print(click==0 ? "Z" : ( click>0 ? "P" : "N" ), 0, 9);

	// display.print("Rotary position", 2);
	display.print(intToTxt(rotaryPosition), 0, 11);
}

void displaySelect(
	UIRoot& ui,
	UIDisplayInterface& display,
	UIScreenSelect& params,
	int incr,
	int click
)
{
	display.print(params.title);

	params.labelSelected = ( params.labelSelected + params.nbLabels + incr ) % params.nbLabels;

	if (click == -1) {
		ui.SwitchScreen(params.screens[params.labelSelected]);
		return;
	}

	for (int i=0, r=0; i<params.nbLabels; i++, r++) {
		if (i==params.labelSelected) {
      display.print("               ", 1+r, 0, 2);  // clear
      display.print(params.labels[i], 1+r, 0, 2);
			r++;
		} else {
      display.print("               ", 1+r, 0);  // clear
			display.print(params.labels[i], 1+r, 0);
		}
	}
}

void displayNumeric(
	UIRoot& ui,
	UIDisplayInterface& display,
	UIScreenNumeric& params,
	int incr,
	int click
)
{

	int val = params.get!= nullptr ? params.get(ui.state) : -123;
	if (incr!=0) {
		val += incr;
		if (params.set!= nullptr)
			params.set(val, ui.state);
	}

	display.print(params.title);
	display.print(intToTxt(val), 2, 0, 4);

	if (click == -1) {
		ui.SwitchScreen(nullptr);  // back
		return;
	}
}

char* intToTxt(int num) {
	static char buf [8];
	//for (int i=0; i<8; i++)
	//	buf[i] = '.';

	sprintf(buf, "%03i", num);
	return buf;
}
