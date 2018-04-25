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

    var cm11aCodes = require('./CM11ACodes');


    var unitAddress = {
        'house': undefined,
        'unit': undefined,
        'address': 0,

        'SetAddress': SetAddress
    };


    function GetDictKeyFromValue(dict, value) {
        var key;

        for(key in dict) {
            if((dict.hasOwnProperty(key) && dict[key] == value)) {
                break;
            }
        }

        return key;
    }


    function SetAddress(house, unit, addr) {
        if(addr === undefined) {
            // Normal method, set based on house and unit code
            if (cm11aCodes.houseCodes.hasOwnProperty(house) || cm11aCodes.unitCodes.hasOwnProperty(unit)) {
                this.house = house;
                this.unit = unit;
                this.address = ((cm11aCodes.houseCodes[house] << 4) | (cm11aCodes.unitCodes[unit]) & 0xFF);
            }
        }
        else {
            this.house = GetDictKeyFromValue(cm11aCodes.houseCodes, (addr >> 4));
            this.unit = GetDictKeyFromValue(cm11aCodes.unitCodes, (addr & 0x0F));
            this.address = addr;
        }
    }


    function UnitAddress(house, unit, addr) {
        var address = Object.create(unitAddress);
        address.SetAddress(house, unit, addr);
        return address;
    }


    module.exports = UnitAddress;

})();
