#import required libraries
import obd
import library

#make local references to relevant display properties, tools, and buttons, 
#	commands, labels, and units as defined in library.py
disp = library.disp
width = disp.width
height = disp.height
image = library.image
draw = library.draw
font = library.font
button_B = library.button_B
button_L = library.button_L
button_R = library.button_R
cmd_book = library.cmd_book
label_book = library.label_book
unit_book = library.unit_book

#clear the display
disp.fill(0)
disp.show()

#connect to the ECU
connection = obd.OBD()

#initialize helper variables to keep track of program position and prevent
#	rapid triggering of inputs
active = 1
down = 0
page = 0

#while loop runs on initialization until user presses B
while(active):

	#query the ECU for the appropriate value as according to program position
	response = connection.query(cmd_book[page]).value.magnitude
	#display to the user what value they are requesting
	draw.text((1, 0), label_book[page], font=font, fill=255)
	#display to the user the value they are requesting with appropriate units
	draw.text((24, 10), (str(library.transform(response, page))[:6] + unit_book[page]), font=font, fill=255)
		
	#right joystick increments page unless on page 11, which loops back to page 1
	if(not button_R.value and not down):
			down = 1
			if(page < 11):
				page += 1
			else:
				page = 0
	
	#left joystick decrements page unless on page 1, which loops back to page 11
	if(not button_L.value and not down):
				down = 11
				if(page > 0):
					page -= 1
				else:
					page = 11
								
	#new input is only accepted if the previous program cycle had no input
	#	this prevents the joysticks from firing multiple inputs in rapid succession from just one push
	if(button_L.value and button_R.value):
			down = 0
	
	#exit the program when user presses B
	if(not library.button_B.value):
		active = 0

	#render our updated image onto the display
	disp.image(image)
	disp.show()
	draw.rectangle((0, 0, width, height), outline=0, fill=0)
