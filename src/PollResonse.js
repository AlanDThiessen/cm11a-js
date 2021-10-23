/******************************************************************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2021 Alan Thiessen
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

    const Transaction = require('./Transaction');
    const cm11aCodes = require('./CM11ACodes');
    const x10Address = require('./UnitAddress');

    const MAX_LEVEL_STATUS = 210;   // When reporting status, the maximum level difference is 210

    // Need to keep unit history until a function code is received
    let unitHistory = {};

    function PollResponse(ctrl, data) {
        let trans = Transaction(ctrl, PRStart, PRRxCallback);
        trans.data = [].concat(data);
        trans.numExpected = undefined;
        trans.ParseData = ParseData;

        return trans;
    }


    function PRStart() {
        let done = true;

        if(this.data.length > 0) {
            if(this.data[0] == cm11aCodes.rx.POLL_REQUEST) {
                this.ctrl.write([cm11aCodes.tx.POLL_RESPONSE], 1500);
                this.data = [];
                done = false;
            }
        }

        if(done) {
            this.done();
        }
    }

/*
    A3 Turned on
    2018-04-24 23:48:41.802 x10-cm11: CM11A Rx: 90
    2018-04-24 23:48:41.803 x10-cm11: CM11A Tx: 195
    2018-04-24 23:48:41.810 x10-cm11: CM11A Rx: 3
    2018-04-24 23:48:41.811 x10-cm11: CM11A Rx: 2
    2018-04-24 23:48:41.817 x10-cm11: CM11A Rx: 98
    2018-04-24 23:48:41.820 x10-cm11: CM11A Rx: 98

    A3 Turned Off
    2018-04-24 23:50:20.275 x10-cm11: CM11A Rx: 90
    2018-04-24 23:50:20.276 x10-cm11: CM11A Tx: 195
    2018-04-24 23:50:20.282 x10-cm11: CM11A Rx: 3
    2018-04-24 23:50:20.285 x10-cm11: CM11A Rx: 2
    2018-04-24 23:50:20.291 x10-cm11: CM11A Rx: 98
    2018-04-24 23:50:20.293 x10-cm11: CM11A Rx: 99

    A3 Dimmed
    2018-04-25 00:17:31.031 x10-cm11: CM11A Rx: 90
    2018-04-25 00:17:31.031 x10-cm11: CM11A Tx: 195
    2018-04-25 00:17:31.038 x10-cm11: CM11A Rx: 3
    2018-04-25 00:17:31.040 x10-cm11: CM11A Rx: 1
    2018-04-25 00:17:31.047 x10-cm11: CM11A Rx: 100
    2018-04-25 00:17:31.049 x10-cm11: CM11A Rx: 113

    2018-04-25 00:20:04.907 x10-cm11: CM11A Rx: 90
    2018-04-25 00:20:04.908 x10-cm11: CM11A Tx: 195
    2018-04-25 00:20:04.914 x10-cm11: CM11A Rx: 3
    2018-04-25 00:20:04.917 x10-cm11: CM11A Rx: 1
    2018-04-25 00:20:04.923 x10-cm11: CM11A Rx: 100
    2018-04-25 00:20:04.925 x10-cm11: CM11A Rx: 79


    A3 Brightened
    2018-04-25 00:19:30.080 x10-cm11: CM11A Rx: 90
    2018-04-25 00:19:30.081 x10-cm11: CM11A Tx: 195
    2018-04-25 00:19:30.089 x10-cm11: CM11A Rx: 3
    2018-04-25 00:19:30.090 x10-cm11: CM11A Rx: 1
    2018-04-25 00:19:30.097 x10-cm11: CM11A Rx: 101
    2018-04-25 00:19:30.099 x10-cm11: CM11A Rx: 90


    2018-04-25 00:20:13.557 x10-cm11: CM11A Rx: 90
    2018-04-25 00:20:13.558 x10-cm11: CM11A Tx: 195
    2018-04-25 00:20:13.565 x10-cm11: CM11A Rx: 3
    2018-04-25 00:20:13.567 x10-cm11: CM11A Rx: 1
    2018-04-25 00:20:13.574 x10-cm11: CM11A Rx: 101
    2018-04-25 00:20:13.576 x10-cm11: CM11A Rx: 35
*/

    function ParseData() {
        // This function won't be called unless we have at least one byte in the array
        let funcAddrMask = this.data.shift();
        let currValue = this.data.shift();

        while(currValue !== undefined) {
            if(funcAddrMask & 0x01) {
                let house = x10Address(null, null, currValue, true).house;
                let funcName = x10Address(null, null, currValue, true).unit;
                let func = cm11aCodes.functionCodes[funcName];
                let deltaLevel = 0;

                if((house !== undefined) && (func !== undefined)) {
                    // DIM and BRIGHT are followed by a level byte
                    if ((func == cm11aCodes.functionCodes.DIM) || (func == cm11aCodes.functionCodes.BRIGHT)) {
                        let level = this.data.shift();

                        if (level !== undefined) {
                            deltaLevel = Math.round(level / MAX_LEVEL_STATUS * 100);
                        }
                    }

                    if (unitHistory.hasOwnProperty(house)) {
                        this.ctrl.notifyUnitStatus(func, house, deltaLevel, unitHistory[house]);
                        unitHistory[house] = [];
                    }
                }
            }
            else {
                let address = x10Address(null, null, currValue);

                if((address.house !== undefined) && (address.unit !== undefined)) {
                    if (!unitHistory.hasOwnProperty(address.house)) {
                        unitHistory[address.house] = [];
                    }

                    // Add this unit to the list if not already on it
                    if (unitHistory[address.house].findIndex((element) => {element.unit == address.unit}) === -1) {
                        unitHistory[address.house].push(address);
                    }
                }
            }

            funcAddrMask >>= 1;
            currValue = this.data.shift();
        }
    }

    function PRRxCallback(data) {
        let done = false;

        if(data.length > 0) {
            if(this.numExpected === undefined) {
                this.numExpected = data.shift();
                this.data = this.data.concat(data);

                // The CM11A never buffers more than 10 bytes
                if((this.numExpected === 0) || (this.numExpected > 10)) {
                    done = true;
                }
            }
            else {
                this.data = this.data.concat(data);
            }

            if(!done && (this.data.length >= this.numExpected) && (this.data.length >= 1)) {
                this.ParseData();
                done = true;
            }
        }

        if(done) {
            this.ctrl.cancelTimer();
            this.done();
        }
    }

    module.exports = PollResponse;

})();