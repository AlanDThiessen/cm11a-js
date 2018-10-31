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


    function SetClock(ctrl, data) {
        var trans = Transaction(ctrl, SCStart, SCCallback);
        trans.data = [].concat(data);
        trans.checksum = 0;
        trans.checksumValid = false;
        trans.numTxAttempts = 0;
        return trans;
    }


    function SCStart() {
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 1);
        var dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        var reverseDay = 0;
        this.txData = [];

        this.txData.push(cm11aCodes.tx.POLL_PF_RESP);
        this.txData.push(now.getSeconds() & 0xFF);

        // If it's an odd hour, then we need to add 60 to the minutes
        if((now.getHours() % 2) === 0) {
            this.txData.push(now.getMinutes() & 0xFF);
        }
        else {
            this.txData.push((60 + now.getMinutes()) & 0xFF);
        }

        // CM11 takes hours / 2 (0 - 11)
        this.txData.push(Math.floor(now.getHours() / 2) & 0xFF);

        // The day of the year is in reverse order
        for(let mask = 0x0001; mask <= 0x0100; mask <<= 1) {
            reverseDay <<= 1;
            reverseDay |= (dayOfYear & mask) ? 0x01 : 0x00;
        }

        reverseDay <<= 7;

        // Day of week mask (SMTWTFS)
        reverseDay |= (0x01 << (6 - now.getDay()));

        this.txData.push((reverseDay >> 8) & 0xFF);
        this.txData.push(reverseDay & 0xFF);

        // For now, just monitor housecode A,
        //    set Timer Purge and Monitor Status Cleared flags
        this.txData.push(((cm11aCodes.houseCodes.A & 0xFF) << 4) | 0x05);

        for(let cntr = 1; cntr < this.txData.length; cntr++) {
            this.checksum += this.txData[cntr];
        }

        this.checksum &= 0x00FF;

        this.ctrl.write(this.txData);
        this.numTxAttempts++;
    }


    function SCCallback(data) {
        var done = false;

        if(data.length > 0) {
            if(this.checksumValid == false) {
                if (data[0] == this.checksum) {
                    this.checksumValid = true;
                }
            }
            else {
                if (data[0] === 0x55) {
                    done = true;
                }
            }
        }

        if(done) {
            this.done();
        }
        else {
            if(this.checksumValid) {
                this.ctrl.write([0x00]);
            }
            else if(this.numTxAttempts < 4) {
                this.ctrl.write(this.txData);
                this.numTxAttempts++;
            }
            else {
                this.done();
            }
        }
    }


    module.exports = SetClock;

})();