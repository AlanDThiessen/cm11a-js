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

(function() {
    'use strict';

    const { SerialPort } = require('serialport');
    const cm11aCodes = require('./CM11ACodes');
    const transactions = require('./CM11ATransactions');
    const x10Address = require('./UnitAddress');

    var CM11A_BUAD = 4800;

    var EVENTS = {
        'unitStatus':   0,
        'status':       1,
        'close':        2
    };


    var CM11A = {
        serial: {},
        running: false,
        currentTrans: undefined,
        transactionQueue: [],
        timer: undefined,
        events: {
            'unitStatus': undefined,
            'status': undefined,
            'close': undefined
        },

        // CM11A Commands
        on: SetEvent,
        start: Start,
        stop: Stop,
        stopped: Stopped,

        // Unit Function Commands
        turnOn: TurnOn,
        turnOff: TurnOff,
        dim: Dim,
        bright: Bright,
        status: Status,
        setClock: SetClock,

        // Callback methods
        notifyUnitStatus: NotifyUnitStatus,
        notifyCM11AStatus: NotifyStatus,
        write: SerialWrite,
        read: SerialRead,
        cancelTimer: CancelTimer,

        // Internally called methods
        runTransaction: RunTransaction,
        runQueuedTransaction: RunQueuedTransaction,
        timeout: Timeout
    };


    function SetEvent(event, callBack) {
        if(!this.events.hasOwnProperty(event)) {
            throw('Invalid event: ' + event);
        }
        else if(typeof(callBack) !== 'function') {
            throw('Expected function for callBack.');
        }
        else {
            this.events[event] = callBack;
        }
    }

    /***
     * @returns {boolean}
     */
    function Start(device) {
        var ctrl = this;

        return new Promise(function(resolve, reject) {
            if (!ctrl.running) {
                ctrl.serial = new SerialPort({
                    path: device,
                    baudRate: 4800
                });

                ctrl.serial.on('data', function (data) {
                    ctrl.read(data);
                });
                ctrl.serial.on('error', HandleError);
                ctrl.serial.on('close', function () {
                    ctrl.stopped();
                });
                ctrl.running = true;

                // Wait for 1-1/2 seconds to see if we need to respond to a poll failure
                setTimeout(function() {
                    resolve(ctrl.running);
                }, 3000);
            }
        });
    }


    /***
     * @returns {boolean}
     */
    function Stop() {
        if(this.currentTrans) {
            /* For now, let the transaction complete gracefully
            this.currentTrans.error('Shutting Down.');
            */
            this.running = false;
        }
        else {
            this.serial.close();
        }
    }


    function Stopped() {
        this.running = false;

        if(this.events.close) {
            this.events.close();
        }
    }


    function RunTransaction(trans) {
        var ctrl = this;

        if(ctrl.running) {
            if (ctrl.currentTrans === undefined) {
                ctrl.currentTrans = trans;
                ctrl.currentTrans.run().then(
                    function() {
                        ctrl.runQueuedTransaction();
                    },
                    function() {
                        ctrl.runQueuedTransaction();
                    });
            }
            else {
                ctrl.transactionQueue.push(trans);
            }
        }
    }


    function RunQueuedTransaction() {
        var ctrl = this;

        ctrl.currentTrans = undefined;

        if(ctrl.running) {
            if (ctrl.transactionQueue.length > 0) {
                ctrl.runTransaction(ctrl.transactionQueue.shift());
            }
        }
        else {
            ctrl.serial.close();
        }
    }


    function AddressToUnit(addresses) {
        var units = [];

        addresses.forEach(function(addr) {
            var code = addr.toUpperCase();
            units.push(x10Address(code.substr(0, 1), code.substr(1)));
        });

        return units;
    }


    function UnitToAddress(units) {
        var addresses = [];

        units.forEach(function(unit) {
            addresses.push(unit.house + unit.unit);
        });

        return addresses;
    }


    function TurnOn(addr) {
        var units = AddressToUnit(addr);
        var command = transactions.Command(this, cm11aCodes.functionCodes.ON, units);
        this.runTransaction(command);
    }


    function TurnOff(addr) {
        var units = AddressToUnit(addr);
        var command = transactions.Command(this, cm11aCodes.functionCodes.OFF, units);
        this.runTransaction(command);
    }



    function Dim(addr, level) {
        var units = AddressToUnit(addr);
        var command = transactions.Command(this, cm11aCodes.functionCodes.DIM, units, level);
        this.runTransaction(command);
    }


    function Bright(addr, level) {
        var units = AddressToUnit(addr);
        var command = transactions.Command(this, cm11aCodes.functionCodes.BRIGHT, units, level);
        this.runTransaction(command);
    }


    function Status() {
        var status = transactions.StatusRequest(this);
        this.runTransaction(status);
    }


    function SetClock() {
        var setClock = transactions.SetClock(this, []);
        this.runTransaction(setClock);
    }


    function NewCm11A() {
        var cm11Obj = Object.create(CM11A);
        return cm11Obj;
    }


    function SerialWrite(data, timer) {
        console.log('CM11A Tx: ' + data);
        this.serial.write(data, function(error) {
            if(error) {
                console.log('Error Writing to CM11A.');
            }
        });

        var ctrl = this;
        if(timer !== undefined) {
            ctrl.timer = setTimeout(function() {
                ctrl.timeout();
            }, timer);
        }
    }


    function SerialRead(data) {
        var buffer = new Buffer.from(data);
        var readData = new Uint8Array(buffer);

        if(readData.length > 0) {
            console.log('CM11A Rx: ' + readData);
            var usedBuffer = false;

            if(this.currentTrans) {
                usedBuffer = this.currentTrans.handleMessage(Array.from(readData));
            }

            if(!usedBuffer) {
                if(readData[0] == cm11aCodes.rx.POLL_REQUEST) {
                    var pollResp = transactions.PollResponse(this, readData);
                    this.runTransaction(pollResp);
                }
                else if(readData[0] == cm11aCodes.rx.POLL_POWER_FAIL) {
                    var setClock = transactions.SetClock(this, readData);
                    this.runTransaction(setClock);
                }
                else if(readData[0] == cm11aCodes.rx.POLL_EEPROM_ADDRESS) {
                    // TODO: One day, implement macros?
                    //var eepromAddress = transactions.EepromAddress(this, readData);
                    //this.runTransaction(eepromAddress);
                }
            }
        }
    }


    function CancelTimer() {
        if(this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }


    function Timeout() {
        if(this.currentTrans !== undefined) {
            this.currentTrans.handleMessage([]);
        }
    }


    function LookupX10Function(x10Func) {
        var codes = Object.keys(cm11aCodes.functionCodes);
        var funcName = '';

        for(var cntr = 0; cntr < codes.length; cntr++) {
            if(cm11aCodes.functionCodes[codes[cntr]] == x10Func) {
                funcName = codes[cntr].toString();
                break;
            }
        }

        return funcName;
    }


    function NotifyUnitStatus(x10Function, houseCode, level, units ) {
        if(this.events.unitStatus !== undefined) {
            this.events.unitStatus( {
                'units': UnitToAddress(units),
                'x10Function': LookupX10Function(x10Function),
                'level': level
            });
        }
    }


    function NotifyStatus(status) {
        if(this.events.status !== undefined) {
            this.events.status(status);
        }
    }


    function HandleError(error) {
        console.log(error);
    }


    module.exports = NewCm11A;

})();
