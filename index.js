const SerialPort = require('serialport');

module.exports = function(app) {
  let plugin = {};
  let serialPort;

  plugin.id = 'my-serial-ais-plugin';
  plugin.name = 'Serial AIS Plugin';
  plugin.description = 'Plugin to communicate with AIS devices over serial port';

  plugin.start = function(options, restartPlugin) {
    app.debug('Plugin started');

    // Open serial port
    serialPort = new SerialPort(options.serialPort, { baudRate: options.baudRate });

    serialPort.on('open', function() {
      app.debug('Serial port opened');
      // Set up your communication protocol here
    });

    serialPort.on('data', function(data) {
      app.debug('Data received: ' + data.toString());
      // Process incoming data
    });

    serialPort.on('error', function(err) {
      app.error('Error: ', err.message);
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
          default: 9600,
          enum: [4800, 9600, 19200, 38400, 57600, 115200],
          description: 'The baud rate for the serial connection'
        }
      },
      required: ['serialPort', 'baudRate']
    };
  };

  return plugin;
};
