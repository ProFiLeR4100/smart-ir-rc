#pragma once

struct PressedButton
{
    double timestamp;
    unsigned int value;

	PressedButton() : timestamp(0), value(0) {}
	PressedButton(double _timestamp, unsigned _value) : timestamp(_timestamp), value(_value) {}
};