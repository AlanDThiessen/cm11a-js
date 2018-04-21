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

    var SerialPort = require('serialport');
    var cm11aCodes = require('CM11ACodes.js');
    var transactions = require('CM11ATransactions.js');

    var CM11A_BUAD = 4800;


    var CM11A = {
        serial: {},
        running: false,
        currentTrans: undefined,
        transactionQueue: [],

        // CM11A Commands
        start: Start,
        stop: Stop,

        // Unit Function Commands
        turnOn: TurnOn,
        turnOff: TurnOff,

        // Callback methods
        notifyUnitStatus: NotifyUnitStatus,
        notifyCM11AStatus: NotifyStatus,
        write: SerialWrite,
        read: SerialRead,

        // Internally called methods
        runTransaction: RunTransaction,
        runQueuedTransaction: RunQueuedTransaction
    };


    /***
     * @returns {boolean}
     */
    function Start() {
        if(!this.running) {
            this.serial = new Serial('/dev/ttyUSB0', {
                baudRate: 4800
            });

            this.serial.on('data', this.read);
            this.serial.on('error', HandleError);
            this.running = true;
        }

        return this.running;
    }


    /***
     * @returns {boolean}
     */
    function Stop() {
        if(this.currentTrans) {
            this.currentTrans.error('Shutting Down.');
        }

        if(this.running) {
            this.serial.close();
        }

        return this.running;
    }


    function RunTransaction(trans) {
        if(this.running) {
            if (this.currentTrans === undefined) {
                this.currentTrans = trans;
                this.currentTrans.run().finally(this.runQueuedTransaction);
            }
            else {
                this.transactionQueue.push(trans);
            }
        }
    }


    function RunQueuedTransaction() {
        this.currentTrans = undefined;

        if(this.transactionQueue.length > 0) {
            RunTransaction(this.transactionQueue.shift());
        }
    }


    function TurnOn(units) {
        var command = transactions.Command(this, cm11aCodes.functionCodes.ON, units);
        this.runTransaction(command);
    }


    function TurnOff(units) {
        var command = transactions.Command(this, cm11aCodes.functionCodes.OFF, units);
        this.runTransaction(command);
    }


    function NewCm11A() {
        var cm11Obj = Object.create(CM11A);
        return cm11Obj;
    }


    function SerialWrite(data) {
        this.serial.write(data, function(error) {
            if(error) {
                console.log('Error Writing to CM11A.');
            }
        });
    }


    function SerialRead(data) {
        var buffer = new Buffer(data);

        if(buffer.length > 0) {
            if(this.currentTrans) {
                this.currentTrans.HandleMessage(buffer);
            }
        }
    }


    function NotifyUnitStatus(x10Function, houseCode, level, units ) {

    }


    function NotifyStatus(status) {

    }


    function HandleError(error) {
        console.log(error);
    }


    module.exports = NewCm11A;

})();