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

    module.exports = {
        tx: {
            HDR_SEL:                0x04,   // Header byte to address a device
            HDR_FUN:                0x06,   // Header byte to send a function command
            XMIT_OK:                0x00,   // Ok for Transmission (Checksum is correct)
            POLL_RESPONSE:          0xC3,   // Respond to a device's poll request
            STATUS_REQUEST:         0x8B,   // Request status from the device
            POLL_PF_RESP:           0x9B    // Respond to power fail poll
        },

        rx: {
            POLL_REQUEST:           0x5A,   // Poll request from CM11A
            POLL_EEPROM_ADDRESS:    0x5B,   // Two bytes following indicate address of timer/macro
            POLL_POWER_FAIL:        0xA5,   // Poll request indicating power fail
            INTERFACE_READY:        0x55    // The interface is ready
        },

        CHECKSUM_CORRECT:       0x00,
        READY:                  0x55,
        EXTENDED_TRANSMISSION:  0x07,
        POLL:                   0x5a,
        ACK:                    0xc3,
        POWER_FAIL:             0xa5,
        CLOCK_UPDATE:           0x9b,
        EEPROM_DOWNLOAD:        0xfb,
        RI_ENABLE:              0xeb,
        RI_DISABLE:             0xdb,
        EEPROM_ADDRESS:         0x5b,
        CM11A_STATUS:           0x8b
    };

})();