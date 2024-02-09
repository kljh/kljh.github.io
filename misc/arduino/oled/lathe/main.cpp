#include <cstdio>
#include "UIDisplayConsole.h"
#include "UI.h"
#include "UILathe.h"

UIRoot* uiroot = nullptr;

void setup(void)
{

	static UIDisplayConsole display;

	// display could be unavailable till loop()
	display.clear();
	display.print("Init Lathe UI");
	display.display();

	uiroot = new UIRoot(display);

	InitLatheUI(*uiroot, nullptr);
}

void loop(void)
{
	int pos = 0, key1 = 0, key2 = 0;
	uiroot->UpdateUI(pos, key1, key2, true);

	// uiroot->UpdateUI(pos++, 1, key2);
	// uiroot->UpdateUI(pos++, 0, key2);

	for (;;) {
		bool click = false;

		char c;
		scanf("%c", &c);

		switch(c) {
			case '[':
				pos--;
				break;
			case ']':
				pos++;
				break;
			case 'i':
				key1 = 1;
				break;
			case 'o':
				key1 = 0;
				break;
			case 'p':
				click = true;
				break;
			case 'q':
				return;
				break;
		}

		if (click) {
			uiroot->UpdateUI(pos, key1++, key2);
			uiroot->UpdateUI(pos, key1--, key2);
		} else {
			uiroot->UpdateUI(pos, key1, key2);
		}
	}
}

int main() {
	setup();
	loop();
	return 0;
}
