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

    var Transaction = require('Transaction.js');

    var ACTIONS = {
        ACTION_ADDRESS: 0,
        ACTION_FUNCTION: 1
    };

    var STATES = {
        STATE_NOT_STARTED: 0,
        STATE_VALIDATE_CHECKSUM: 1,
        STATE_WAIT_READY: 2,
        STATE_COMPLETE: 3
    };

    var MAX_ATTEMPTS = 5;

    function Command(ctrl, x10Func, units, level) {
        var trans = Transaction(ctrl, CmdStart, CmdRxCallBack, CmdComplete);
        trans.x10Func = x10Func;
        trans.units = units;
        trans.level = level;
        trans.state = STATES.STATE_NOT_STARTED;
        trans.numAttempts = 0;
        trans.currentUnit = undefined;
        trans.checksum = 0;

        trans.AddressUnit = AddressUnit;

        return trans;
    }


    function CmdStart() {
        if(this.AddressUnit()) {
            this.state = STATES.STATE_VALIDATE_CHECKSUM;
        }
        else {
            this.state = STATES.STATE_COMPLETE;
        }
    }


    function CmdRxCallBack(data) {

    }


    /***
     * @returns {boolean}
     */
    function CmdComplete() {
        return (this.state === STATE.STATE_COMPLETE);
    }


    function AddressUnit() {
    }


    module.exports = Command;

})();