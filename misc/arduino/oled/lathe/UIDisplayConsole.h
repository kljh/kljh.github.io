#pragma once
#include "UIDisplayInterface.h"

class UIDisplayConsole : public UIDisplayInterface
{
public:
	UIDisplayConsole();
	virtual void clear() override;
	virtual void print(const char *txt, int row = 0, int col = 0, int size = 1, int inverse = 0) override;
	virtual void display() override;
};


