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


/***
 * From http://www.heyu.org/docs/protocol.txt

 9.    Status Request.

 This command is purely intended for the CM11 and CP10.

 The PC can request the current status from the interface at any time as
 follows:

 CM11:

 For a CM11, the status request is:    0x8b.

 The status request is immediately followed by:

 Note:  This is really interesting.  The byte order is reversed per
 the note in section 8.  The last 3 bytes are each mapped to show a
 1 in the bit position if the unit with value equating to the nibble
 (section 1) is set.  Low byte comes first, hi byte second.
 Example: if unit 1 is on, the nibble = 6, so the mask
 would show 00...0100000
 Note also that the hi bit of byte 6 must be multiplied by 256 and added to
 the decimal value of byte 5 (+1) to find the Julian date.
 DBS Jan 1, 1997

 The battery timer "(set to 0xffff on reset)" below refers to a "cold"
 restart, i.e, if the interface has been disconnected from AC power _and_
 the batteries have been removed for some indeterminate period of time.
 When this condition occurs, it is necessary to send a status update with
 the battery timer clear bit set, whereupon the timer will be reset
 to 0000 and start to respond to interruptions in AC power, incrementing
 by minutes of operation on battery power.
 CWS Sep 1, 2002


 Bit range    Description
 111 to 96    Battery timer (set to 0xffff on reset)        (Byte  0- 1)
  95 to 88    Current time (seconds)                        (Byte  2   )
  87 to 80    Current time (minutes ranging from 0 to 119)  (Byte  3   )
  79 to 72    Current time (hours/2, ranging from 0 to 11)  (Byte  4   )
  71 to 63    Current year day (MSB bit 63)                 (Byte  5+  )
  62 to 56    Day mask (SMTWTFS)                            (Byte  6-  )
  55 to 52    Monitored house code                          (Byte  7 lo)
  51 to 48    Firmware revision level 0 to 15               (Byte  7 hi)
  47 to 32    Currently addressed monitored devices         (Byte  8- 9)
  31 to 16    On / Off status of the monitored devices      (Byte 10-11)
  15 to 0     Dim status of the monitored devices           (Byte 12-13)

*/

(function() {
    'use strict';

    var Transaction = require('./Transaction');
    var cm11aCodes = require('./CM11ACodes');

    var STAUS_REQUEST_NUM_BYTES = 14;


    function StatusRequest(ctrl) {
        var trans = Transaction(ctrl, SRStart, SRRxCallBack);
        trans.data = [];
        return trans;
    }


    function SRStart() {
        this.ctrl.write([cm11aCodes.tx.STATUS_REQUEST]);
    }


    /***
     * @param data
     * @returns {boolean}
     */
    function SRRxCallBack(data) {
        this.data = this.data.concat(data);

        if(this.data.length >= STAUS_REQUEST_NUM_BYTES) {
            var status = ParseStatus(this.data);
            this.ctrl.notifyCM11AStatus(status);
            this.done(status);
        }
    }


    function ParseStatus(data) {
        return {
            batteryTimer: (data[0] << 8) | (data[1]),
            firmwareRev: data[7] & 0x0F,
            time: {
                dayOfYear: data[5] + 1 + ((data[6] & 0x80) << 1),
                hours: (data[4] * 2) + (data[3] >= 60) ? 1 : 0,
                minutes: data[3] % 60,
                seconds: data[2]
            },
            monitoredDevices: {
                houseCode: data[7] >> 4,
                addresed: (data[9] << 8) | (data[8]),
                onOffStatus: (data[11] << 8) | (data[10]),
                dimStatus: (data[13] << 8) | (data[12]),
            },
            dayMask: data[6] & 0x7F,
        }
    }


    module.exports = StatusRequest;

})();