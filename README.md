# signalk_ais_control

Simple SignalK server plugin to communicate with a True Heading AIS Transponder over a serial port using the same protocol used in the ProAis software. This software is used by a number of AIS transponders using the same oem board as true heading so if your transponder works with ProAis its a good chance that it will work with this plugin. 

Currently the plugin does the following:
- Read LED status to determine if there are errors and if the transponder is transmitting or is in silent mode
- Turn silent mode on and off, but these functions are not published yet
  
