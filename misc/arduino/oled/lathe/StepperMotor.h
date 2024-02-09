
// Ramps PIN definition
#define X_MIN  3
#define X_MAX  2
#define Z_MIN  18
#define Z_MAX  19
#define X_STEP A0
#define X_DIR  A1
#define X_EN   38
#define Y_STEP A6
#define Y_DIR  A7
#define Y_EN   A2
#define Z_STEP 46
#define Z_DIR  48
#define Z_EN   A8


void StepperMotorsInit();

int PowerFeedSpeed(void *);
void PowerFeed(int speed, void*);




