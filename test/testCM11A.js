
/******************************************************************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Alan Thiessen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 ******************************************************************************/


// TODO: Eventually use Jasmine or Chai to create auto tests
// For now... run manual testing

const SerialPort = require('serialport/test');
const MockBinding = SerialPort.Binding;
const CM11A = require('../src/CM11A');
const cm11aCodes = require('../src/CM11ACodes');

// Create a port and enable the echo and recording.
MockBinding.createPort('/dev/MOCK', { echo: true, readyData: [0x00] });

var cm11 = CM11A();
cm11.on('unitStatus', onUnitStatus);
cm11.on('status', onStatus);
cm11.on('close', onClose);

//cm11.start('/dev/MOCK');
cm11.start('/dev/ttyUSB0');
var addr = ['A1', 'a2'];
cm11.turnOn(addr);
cm11.dim(addr, 11);
cm11.bright(addr, 11);
cm11.turnOff(addr);

setTimeout(function() {
    cm11.stop();
}, 9000);


function onClose() {
    console.log('CM11 Closed');
    cm11 = undefined;
    process.exit();
}


function onUnitStatus(status) {
    console.log(status)
}


function onStatus(status) {
    console.log(status)
}
