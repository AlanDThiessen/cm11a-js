# cm11a-js

A Node.js module for controlling X10 devices through a serial CM11A interface. It allows NodeJe applications to conrol X10 devices through the serial interface of the CM11A, and monitors status of X10 devices.

## Installation

`npm install cm11a-js`

## Usage

```javascript
// Import the module
const CM11A = require('cm11a-js');

// Create an CM11 object
let cm11 = CM11A();

// Start the service, connecting to the Serial Port
cm11.start('/dev/ttyUSB0');

// Issue Commands
let units = ['A1', 'A2'];

cm11.turnOn(units);
cm11.dim(units, 11);
cm11.bright(units, 11);
cm11.turnOff(units);

// Close the connection to the CM11A
cm11.stop();
```

### Commands

#### Start

`cm11.start(port);`

Opens serial communications with the CM11A on the specified serial port, and begins monitoring for unit status.

- `port` is the serial port to open, e.g. `/dev/ttyUSB0` on Linux, and `COM1` on Windows.

#### Stop

`cm11.stop();`

Close serial communications with the CM11A, and stops monitoring device status.

#### Turn On

`cm11.turnOn(addresses);`

Turns on the specified unit addresses.

- `addresses` is an array of X10 device addresses.  e.g. ['A1', 'A3']

#### Turn Off

`cm11.turnOff(addresses);`

Turns off the specified unit addresses.

- `addresses` is an array of X10 device addresses.  e.g. ['A1', 'A3']

#### Bright

`cm11.bright(addresses, level);`

Brightens the the specified unit addresses by the specfied level.

- `addresses` is an array of X10 device addresses.  e.g. ['A1', 'A3']
- `level` is a value between 0 and 22, indicating how much to brighten the device.  Note: this is a relative value, not an absolute value.

#### Dim

`cm11.dim(addresses, level);`

Dims the the specified unit addresses by the specfied level.

- `addresses` is an array of X10 device addresses.  e.g. ['A1', 'A3']
- `level` is a value between 0 and 22, indicating how much to dim the device.  Note: this is a relative value, not an absolute value.

#### setClock

`cm11.setClock();`

Sets the clock of the CM11A controller to the current time provided by the PC.

#### status

`cm11.status();`

Reads the status from the CM11A returns the status through the status callback event below.

## Events

Calling modules can subscribe to the following events on cm11a-js interface.

### Unit Status

Provides the status of X10 devices when the CM11A detects a change on the power line.

```javascript
cm11a.on('unitStatus', callback);
```

When the status of a device changes, the callback function will be called with the following object:

```javascript
{
    // An array of unit codes for which status is being reported.
    units: array,
        
    // The X10 Function that was called on the device       
    x10Function: string,
    
    // The level of the function is DIM or BRIGHT    
    level: number
}
```

### Device Status

Provides the status of the CM11A as read from the device with the `status()` function.

```javascript
cm11a.on('status', callback);
```

After the status has been read from the CM11A, the specified callback function will be called with the following object:

*See section 9 in the [Interface Communication Protocol](https://www.heyu.org/docs/protocol.txt) on the [Heyu](https://www.heyu.org/) website for more details.*

```javascript
{
    // Time since last battery change
    batteryTimer: value,
  
    // CM11A Firmware Revision
    firmwareRev: value,
  
    // An object containing values of the CM11A's clock
    time: {
        // Day of the year
        dayOfYear: value,

        // Hour of the day
        hours: value,

        // Minute of the hour
        minutes: value,

        // Second of the minute
        seconds: value
    },
    
    // An object containing the status of monitored devices
    monitoredDevices: {
        // House code being monitored
        houseCode: value,

        // Currently addressed devices    
        addresed: value,

        // On/Off status of monitored devices
        onOffStatus: value,

        // Dim status of the monitored devices
        dimStatus: value
    },
    // A bitmask indicating Which day it is (SMTWTFS)
    dayMask: value
}
```

### Close

Notifies the calling software when communications with the CM11A have been closed.

```javascript
cm11a.on('close', callback);
```

When the serial port has been closed, the specified callback function will be called with no parameters.


## Acknowledgements

### Heyu
Kudos to the [Heyu](https://www.heyu.org/) project.  Heyu provides a complete interface to the CM11A (and other devices).  The documentation and research they have done has been priceless!  Heyu ran my house for many years!
