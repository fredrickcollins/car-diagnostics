#import required libraries
import obd
import busio
import board
import adafruit_ssd1306
from board import SCL, SDA
from PIL import Image, ImageDraw, ImageFont
from digitalio import DigitalInOut, Direction, Pull

#get instances of all commands required for the command book
intake_pressure = obd.commands.INTAKE_PRESSURE
rpm = obd.commands.RPM
speed = obd.commands.SPEED
load = obd.commands.ENGINE_LOAD
volumetric_efficiency = obd.commands.ABSOLUTE_LOAD
timing = obd.commands.TIMING_ADVANCE
throttle = obd.commands.RELATIVE_THROTTLE_POS
coolant = obd.commands.COOLANT_TEMP
intake_temp = obd.commands.INTAKE_TEMP
afr = obd.commands.COMMANDED_EQUIV_RATIO
ambient = obd.commands.AMBIANT_AIR_TEMP
dtc = obd.commands.GET_DTC

#define the i2c connection and display interface
i2c = busio.I2C(SCL, SDA)
disp = adafruit_ssd1306.SSD1306_I2C(128, 32, i2c)

#get instances of tools from PIL library to manipulate the display
image = Image.new("1", (disp.width, disp.height))
draw = ImageDraw.Draw(image)
font = ImageFont.load_default()

#define each required input on the display board
button_A = DigitalInOut(board.D5)
button_A.direction = Direction.INPUT
button_A.pull = Pull.UP

button_B = DigitalInOut(board.D6)
button_B.direction = Direction.INPUT
button_B.pull = Pull.UP

button_U = DigitalInOut(board.D17)
button_U.direction = Direction.INPUT
button_U.pull = Pull.UP

button_D = DigitalInOut(board.D22)
button_D.direction = Direction.INPUT
button_D.pull = Pull.UP

button_L = DigitalInOut(board.D27)
button_L.direction = Direction.INPUT
button_L.pull = Pull.UP

button_R = DigitalInOut(board.D23)
button_R.direction = Direction.INPUT
button_R.pull = Pull.UP

#package commands into a list
cmd_book = [rpm, speed, intake_pressure, intake_temp, intake_pressure,
			volumetric_efficiency, load, timing, throttle, afr, coolant, ambient]

#package labels into a list			
label_book = ['Engine RPM', 'Vehicle Speed', 'Intake Pressure', 'Intake Temperature',
				'Boost Pressure', 'Volumetric Efficiency', 'Engine Load', 'Timing Advance', 
				'Throttle Position', 'Air/Fuel Ratio', 'Coolant Temperature', 'Ambient Temperature']

#package units into a list
unit_book = [' RPM', ' MPH', ' PSI', ' \u00B0F', ' PSI', ' %', ' %', ' \u00B0', ' %', '', ' \u00B0F', ' \u00B0F']

#handle unit conversions to american norms
def transform(cmd, n):
	
	#kph to mph
	if(n == 1):
		return cmd * 0.621371
	
	#kpa to psi
	if(n == 2):
		return cmd * 0.145038
		
	#celsius to fahrenheit
	if(n == 3 or n == 10 or n == 11):
		return (cmd * 1.80) + 32 

	#kpa to psi, boost = intake pressure - barometric pressure
	if(n == 4):
		return (cmd * 0.145038) - 14.695950
	
	#air fuel ratio is returned as a commanded multiple of stochiometric (14.7 grams of air to 1 gram of fuel)
	if(n == 9):
		return cmd * 14.70
	
	#no conversion needed
	return cmd

#these are all indexed to the same order so they can be easily referenced together in a loop