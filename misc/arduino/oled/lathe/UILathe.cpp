
#include "UILathe.h"
#include "StepperMotor.h"

static const char* xAxis = "X Axis";
UIScreenSelect mainMenu("Lathe");
UIScreenSelect screwMenu("Screw");
static UIScreenNumeric xSelect(xAxis);
static UIScreenNumeric ySelect("Y Axis");
UIScreenNumeric pitchSelect("Screw pitch");

void InitLatheUI(UIRoot& ui, void* state)
{
	ui.screen = &mainMenu;
	ui.state = state;

	static const char* mainMenuLabels [] = { "Move X", "Move Y", "Screw " };
	static UIScreen* mainMenuScreens[] = { &xSelect, &ySelect, &screwMenu };
	mainMenu.nbLabels =  sizeof(mainMenuLabels) / sizeof(const char*);
	mainMenu.labels = (const char**)mainMenuLabels;
	mainMenu.labelSelected = 0;
	mainMenu.screens = mainMenuScreens;

	static const char* screwMenuLabels [] = { "Pitch  ", "Pitch unit  ", "Direction", "Back   " };
	static UIScreen* screwMenuScreens[] = { &pitchSelect, &pitchSelect, &pitchSelect, nullptr };
	screwMenu.nbLabels =  sizeof(screwMenuLabels) / sizeof(const char*);
	screwMenu.labels = (const char**)screwMenuLabels;
	screwMenu.labelSelected = 0;
	screwMenu.screens = screwMenuScreens;

	xSelect.get = PowerFeedSpeed;
	xSelect.set = PowerFeed;

	ySelect.get = PowerFeedSpeed;
	ySelect.set = PowerFeed;

}

#ifndef ARDUINO

#include <cstdio>

static int rpm;
int PowerFeedSpeed(void *)
{
	return rpm;
}

void PowerFeed(int speed, void*)
{
	printf("PowerFeedSpeed %i", speed);
	rpm = speed;
}

#endif
