
#include "StepperMotor.h"

// #define USE_ACCEL

#if defined(USE_ACCEL)
#include <AccelStepper.h>
#else
#include <MobaTools.h>
#endif

// Stepper motor libraries : AccelStepper / MobaTools
// defines pins numbers
const int stepPin = X_STEP;
const int dirPin = X_DIR;
const int enablePin = X_EN;

// Define a stepper and the pins it will use

#if defined(USE_ACCEL)
// AccelStepper::DRIVER means a stepper driver (with Step and Direction pins)
AccelStepper stepper(AccelStepper::DRIVER, stepPin, dirPin);
#else
const unsigned int motorStepsPerRev = 400;
const unsigned int microstepMultiplier = 4;
const int STEPS_REVOLUTION = motorStepsPerRev * microstepMultiplier;
MoToStepper stepper( STEPS_REVOLUTION, STEPDIR );
#endif

void StepperMotorsInit()
{
#if defined(USE_ACCEL)
	stepper.setEnablePin(enablePin);
	// stepper.enableOutputs();
	stepper.disableOutputs();
	stepper.setMaxSpeed(1000);
	stepper.setSpeed(250);
	stepper.runSpeed();
#else
	stepper.attach( stepPin, dirPin );
	stepper.attachEnable(enablePin, 5, 0);  // delay 5ms between enable and 1st step, active high or low
	stepper.setSpeed(4);  // = 0.4 RPM  speed in rpm /10
	stepper.setRampLen(2);
	stepper.setZero();
#endif
}

static int s_speed = 0;

int PowerFeedSpeed(void *)
{
	return s_speed ;
}

void PowerFeed(int speed, void*)
{
	s_speed = speed;

	// if (stepper.distanceToGo() == 0)
        // Random change to speed, position and acceleration
        // Make sure we dont get 0 speed or accelerations
        // stepper.moveTo(rand() % 200);
        // stepper.setMaxSpeed((rand() % 200) + 1);
        //stepper.setAcceleration((rand() % 200) + 1);

	#if defined(USE_ACCEL)
	stepper.setSpeed(speed * 100);
	stepper.runSpeed();
	//stepper1.moveTo(6000);
	#else
	stepper.setSpeed(60*speed);  // 10th of RPM x60 => 10th of rotations per seconds
	stepper.rotate(1);  // turn CW
	#endif
}

