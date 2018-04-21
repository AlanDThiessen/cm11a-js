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

    var Transaction = require('./Transaction');
    var cm11aCodes = require('./CM11ACodes');

    var ACTIONS = {
        ACTION_ADDRESS: 0,
        ACTION_FUNCTION: 1
    };


    var MAX_ATTEMPTS = 5;
    var MAX_DIM = 22;

    function Command(ctrl, x10Func, units, level) {
        var trans = Transaction(ctrl, CmdStart, CmdRxCallBack);
        trans.x10Func = x10Func;
        trans.units = units;
        trans.level = level;
        trans.numAttempts = 0;
        trans.currentUnit = 0;
        trans.checksum = 0;
        trans.state = function() { return false; };
        trans.houseCode = 'A';

        trans.AddressUnit = AddressUnit;
        trans.SendFunction = SendFunction;
        trans.StateValidateChecksum = StateValidateChecksum;
        trans.StateWaitReady = StateWaitReady;

        return trans;
    }


    function CmdStart() {
        if(this.AddressUnit()) {
            this.state = this.StateValidateChecksum;
        }
        else {
            this.error('No units to send commend to.');
        }
    }


    function CmdRxCallBack(data) {
        return this.state(data);
    }

    /***
     * @param data
     * @returns {boolean}
     */
    function StateValidateChecksum(data) {
        var retry = true;

        if(data.length > 0) {
            var checksum = data[0];

            if(checksum == this.checksum) {
                this.ctrl.cancelTimer();
                this.ctrl.write([cm11aCodes.tx.XMIT_OK], 1000);
                this.state = this.StateWaitReady;
                retry = false;
            }
        }

        if(retry) {
            this.numAttempts++;

            if(this.numAttempts > MAX_ATTEMPTS) {
                this.error('Max attempts exceeded sending commend.');
            }
            else {
                if(this.action == ACTIONS.ACTION_ADDRESS) {
                    this.AddressUnit();
                }
                else if(this.action == ACTIONS.ACTION_FUNCTION) {
                    this.SendFunction();
                }
            }
        }

        return true;
    }


    /***
     * @param data
     * @returns {boolean}
     */
    function StateWaitReady(data) {
        var retry = true;

        if(data.length > 0) {
            var response = data[0];

            this.ctrl.cancelTimer();

            if(response == cm11aCodes.rx.INTERFACE_READY) {
                if(this.action == ACTIONS.ACTION_ADDRESS) {
                    this.currentUnit++;

                    if(!this.AddressUnit()) {
                        // No more units to address
                        this.SendFunction();
                    }

                    this.state = this.StateValidateChecksum;
                }
                else if(this.action == ACTIONS.ACTION_FUNCTION) {
                    this.ctrl.notifyUnitStatus(this.x10Func, this.houseCode, this.level, this.units);
                    this.done();
                }

                retry = false;
            }
        }

        if(retry) {
            this.numAttempts++;

            if(this.numAttempts > MAX_ATTEMPTS) {
                this.error('Max attempts exceeded sending commend.');
            }
            else {
                if(this.action == ACTIONS.ACTION_ADDRESS) {
                    this.AddressUnit();
                }
                else if(this.action == ACTIONS.ACTION_FUNCTION) {
                    this.SendFunction();
                }
            }
        }

        return true;
    }


    /***
     * @returns {boolean}
     */
    function AddressUnit() {
        var unitAddressed = false;

        if( this.currentUnit < this.units.length ) {
            this.action = ACTIONS.ACTION_ADDRESS;
            this.ctrl.write([cm11aCodes.tx.HDR_SEL, this.units[this.currentUnit].address], 1000);
            this.checksum = (cm11aCodes.tx.HDR_SEL + this.units[this.currentUnit].address) & 0x00FF;
            unitAddressed = true;
        }

        return unitAddressed;
    }


    /***
     */
    function SendFunction() {
        this.action = ACTIONS.ACTION_FUNCTION;
        this.houseCode = this.units[0].house;

        var cmd = (cm11aCodes.houseCodes[this.houseCode] << 4) | this.x10Func;
        var header = cm11aCodes.tx.HDR_FUN;

        if(this.level > MAX_DIM) {
            this.level = MAX_DIM;
        }

        if((this.x10Func == cm11aCodes.functionCodes.DIM) || (this.x10Func == cm11aCodes.functionCodes.BRIGHT)) {
            header |= (this.level << 3)
        }

        this.checksum = (header + cmd) & 0x00FF;
        this.ctrl.write([header, cmd], 1000);
    }


    module.exports = Command;

})();