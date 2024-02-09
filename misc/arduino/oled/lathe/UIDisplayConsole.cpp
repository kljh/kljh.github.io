#ifndef ARDUINO
#include "UIDisplayConsole.h"
#include <cstdio>

UIDisplayConsole::UIDisplayConsole() {}

void UIDisplayConsole::clear()
{
	printf("\n ----- \n");
}

void UIDisplayConsole::print(const char *txt, int row, int col, int txtsize, int inverse)
{
	printf("row=%i col=%i size=%i   %s%s %s \n", row, col, txtsize, txtsize>1 ? ">" : " ", inverse ? "*" : " ", txt);
}

void UIDisplayConsole::display()
{
	printf("\n");
}

#endif
