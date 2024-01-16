
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');




module.exports = function(app) {
  let plugin = {};
  let serialPort;

  plugin.id = 'my-serial-ais-plugin';
  plugin.name = 'Serial AIS Plugin';
  plugin.description = 'Plugin to communicate with AIS devices over serial port';

  plugin.start = function(options, restartPlugin) {

    function sendCommand(command) {
      if (serialPort && serialPort.isOpen) {
        serialPort.write(command + '\r\n', (err) => {
          if (err) {
            app.error('Error on write: ', err.message);
          } else {
            app.debug(`Command sent: ${command}`);
          }
        });
      } else {
        app.error('Serial port is not open');
      }
    }

    function sendAuthorization() {
      const authorizationCommand = '$PSRT,012,(--QuaRk--)*4B';
      sendCommand(authorizationCommand);
    }
    
    function enableSilentMode() {
      sendAuthorization();
      // Delay to ensure authorization command is processed before sending the next command
      setTimeout(() => {
        sendCommand('$PSRT,TRG,0233*6A');
      }, 500); // Adjust delay as needed
    }
    
    function disableSilentMode() {
      sendAuthorization();
      // Delay to ensure authorization command is processed before sending the next command
      setTimeout(() => {
        sendCommand('$PSRT,TRG,0200*6A');
      }, 500); // Adjust delay as needed
    }
    

    app.debug('Plugin started');
    if (!options.serialPort) {
      app.error('Serial port not defined in plugin configuration');
      return;
    }

    // Open serial port
   // serialPort = new SerialPort(options.serialPort, { baudRate: options.baudRate });

    const serialPort = new SerialPort({
      path:options.serialPort,
      baudRate: options.baudRate,
    
    
    });

     // Use the Readline parser
     parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));


     parser.on('data', (line) => {
       app.debug(`Received line: ${line}`);
       // Process the line here
       processReceivedLine(line);
     });


      function processReceivedLine(line) {
        if (line.startsWith('$PSRT,LED')) {
          const ledStatus = parseLEDStatus(line);
          app.debug(`LED Status: ${JSON.stringify(ledStatus)}`);
          // You can now use ledStatus.powerOn, ledStatus.txTimeout, etc.
          sendDelta(ledStatus.srmStatus, 'ais.status.silentmode');
          sendDelta(ledStatus.error, 'ais.status.error');
        }
      }

      function sendDelta(srmStatus, path) {
        const delta = {
          context: 'vessels.self',
          updates: [
            {
              source: { label: 'True Heading AIS controller ' },
              timestamp: new Date().toISOString(),
              values: [
                {
                  path: path,
                  value: srmStatus
                }
              ]
            }
          ]
        };
        app.handleMessage(plugin.id, delta);
      }
      

      function parseLEDStatus(line) {
        // Format: $PSRT,LED,a*hh, where 'a' is in decimal
        const parts = line.split('*')[0].split(',');
        if (parts.length > 2) {
          const statusByte = parseInt(parts[2], 10); // Convert decimal to integer
          return {
            powerOn: !!(statusByte & 0x01), // Bit 1: Power On
            txTimeout: !!(statusByte & 0x02), // Bit 2: TX Timeout
            error: !!(statusByte & 0x04), // Bit 3: Error
            srmStatus: !!(statusByte & 0x08) // Bit 4: SRM Status
          };
        }
        return {
          powerOn: false,
          txTimeout: false,
          error: false,
          srmStatus: false
        };
      }
      
      
     serialPort.on('error', (err) => {
       app.error(`Error: ${err.message}`);
     });

    serialPort.on('open', function() {
      app.debug('Serial port opened');
      // Set up your communication protocol here
      sendCommand('$DUAIQ,LED*29');
      // Then repeat the command every 5 seconds
      setInterval(() => {
        sendCommand('$DUAIQ,LED*29');
      }, 5000);
    });
  };

  plugin.stop = function() {
    app.debug('Plugin stopped');
    if (serialPort) {
      serialPort.close();
    }
  };

  plugin.schema = function() {
    return {
      type: 'object',
      properties: {
        serialPort: {
          type: 'string',
          title: 'Serial Port',
          description: 'The name of the serial port (e.g., COM3, /dev/ttyUSB0)'
        },
        baudRate: {
          type: 'number',
          title: 'Baud Rate',
          default: 38400,
          enum: [4800, 9600, 19200, 38400, 57600, 115200],
          description: 'The baud rate for the serial connection'
        }
      },
      required: ['serialPort', 'baudRate']
    };
  };

  return plugin;
};
