#pragma once

class UIDisplayInterface
{
public:
	virtual void clear() = 0;
	virtual void print(const char *txt, int row = 0, int col = 0, int size = 1, int inverse = 0) = 0;
	virtual void display() = 0;
};
