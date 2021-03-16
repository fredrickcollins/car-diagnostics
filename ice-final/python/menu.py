#import required libraries
import os
import library

#make local references to relevant display properties, tools, and buttons 
#	as defined in library.py
disp = library.disp
width = disp.width
height = disp.height
image = library.image
draw = library.draw
font = library.font
button_A = library.button_A
button_U = library.button_U
button_D = library.button_D

#clear the display
disp.fill(0)
disp.show()

#two pages of options, each split from a list
#	even with only four options, a second page with
#	two empty entries made the most sense for program construction
menu_page_1 = "Diagnostics,Display,Logging"
menu_page_2 = "Power Off, , "
q1, q2, q3 = menu_page_1.split(",")

#initialize helper variables to keep track of program position and prevent
#	rapid triggering of inputs
down = 0
pointer = 1
menu = 1

#while loop runs on initialization until user powers down the system
while(menu):

	#down joystick increments pointer unless on page 2, which loops back to page 1, pointer 1
	if(not button_D.value and not down):
		if(down == 0):
			down = 1
			if(pointer < 4):
				pointer += 1
			else:
				pointer = 1

	#up joystick increments pointer unless on page 1 pointer 1, which loops back to page 2, pointer 1
	if(not button_U.value and not down):
			if(down == 0):
				down = 1
				if(pointer > 1):
					pointer -= 1
				else:
					pointer = 4

	#a pointer value of 4 displays the second page of options
	#	all others display page 1
	if(pointer == 4):
		q1, q2, q3 = menu_page_2.split(",")
	else:
		q1, q2, q3 = menu_page_1.split(",")
		

	#launch the selected program when the user presses A
	#	exec(open('file.py').read()) executes .py files and
	#	pauses this program until they are complete
	if(not button_A.value):
		if(pointer == 1):
			exec(open("/home/pi/dtc.py").read())

		if(pointer == 2):
			exec(open("/home/pi/display.py").read())

		if(pointer == 3):
			exec(open("/home/pi/log_run.py").read())
		
		#selected pointer 4 is power off, exit while loop
		if(pointer == 4):
			menu = 0
	
	#new input is only accepted if the previous program cycle had no input
	#	this prevents the joysticks from firing multiple inputs in rapid succession from just one push
	if(button_U.value and button_D.value):
		down = 0

	#draw the appropriate program names according to pointer position
	#	a makeshift arrow <- displays at the index of pointer
	draw.text((1, 0), q1 + (" <-" if pointer == 1 or pointer == 4 else ""), font=font, fill=255)
	draw.text((1, 10), q2 + (" <-" if pointer == 2 else ""), font=font, fill=255)
	draw.text((1, 20), q3 + (" <-" if pointer == 3 else ""), font=font, fill=255)

	#render our updated image onto the display
	disp.image(image)
	disp.show()
	draw.rectangle((0, 0, width, height), outline=0, fill=0)

#user selected power off to exit loop
#	interpreter reaches end of file, clears screen and tells the system to power down
disp.image(image)
disp.show()
os.system("sudo shutdown now")