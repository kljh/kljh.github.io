#pragma once
#include "UIDisplayInterface.h"

enum UIScreenType { Default, Select, Numeric };
struct UIScreen;

struct UIRoot
{
	UIRoot(UIDisplayInterface& display);

	void SwitchScreen(
		UIScreen *screenToDisplay);

	void UpdateUI(
		int rotaryPosition,
		int buttonState,
		int buttonState2,
		bool bForceUpdate = false
		);

private:
	UIDisplayInterface& display;
	int rotaryPosition;
	int buttonState;
	int buttonState2;

public:
	UIScreen *screen;
	void* state;
};



typedef int (*UIValueGetter)(void*);
typedef void (*UIValueSetter)(int, void*);

struct UIScreen
{
	UIScreen(const char* title, UIScreenType screenType)
		: title(title), screenType(screenType), returnScreen(nullptr) {}

	const char* title;
	UIScreenType screenType;

	UIScreen *returnScreen;
};

struct UIScreenSelect : UIScreen
{
	UIScreenSelect(const char* title)
		: UIScreen(title, Select), get(nullptr), set(nullptr) {}

	int nbLabels;
	int labelSelected;
	const char** labels;
	UIScreen** screens;
	UIValueGetter get;
	UIValueSetter set;
};

struct UIScreenNumeric : UIScreen
{
	UIScreenNumeric(const char* title)
		: UIScreen(title, Numeric), get(nullptr), set(nullptr) {}

	// const char* title;  // NO WARNING FOR REDECLARATION HIDDING MEMBER FROM PARENT ?? 
	int minValue, maxValue;
	UIValueGetter get;
	UIValueSetter set;
};
