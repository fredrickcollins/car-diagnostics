#import required libraries
import obd
import library

#make local references to relevant display properties, tools, and buttons 
#	as defined in library.py
disp = library.disp
width = disp.width
height = disp.height
image = library.image
draw = library.draw
font = library.font
button_B = library.button_B

#clear the display
disp.fill(0)
disp.show()

#connect to the ECU
connection = obd.OBD()

#define command to query for trouble codes
cmd = library.dtc

#default message
message = 'No Trouble Here.'

#query the ECU for trouble codes
#if a response comes back, save the code as message
#if not, the default message is fine
try:
	response = connection.query(cmd).value
	message = response[0]
except:
	pass

#initialize helper variable to keep track of program position
active = 1

#while loop runs on initialization until user presses B
while(active):
		
		#display message to the user
        draw.text((10, 10), message, font=font, fill=255)

		#exit the program when user presses B
        if(not button_B.value):
                active = 0

		#render our updated image onto the display
        disp.image(image)
        disp.show()
        draw.rectangle((0, 0, width, height), outline=0, fill=0)