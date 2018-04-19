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


const HOUSE_ENCMAP = {
    'A': 0x6,
    'B': 0xE,
    'C': 0x2,
    'D': 0xA,
    'E': 0x1,
    'F': 0x9,
    'G': 0x5,
    'H': 0xD,
    'I': 0x7,
    'J': 0xF,
    'K': 0x3,
    'L': 0xB,
    'M': 0x0,
    'N': 0x8,
    'O': 0x4,
    'P': 0xC
};


const UNIT_ENCMAP = {
    '1': 0x6,
    '2': 0xE,
    '3': 0x2,
    '4': 0xA,
    '5': 0x1,
    '6': 0x9,
    '7': 0x5,
    '8': 0xD,
    '9': 0x7,
    '10': 0xF,
    '11': 0x3,
    '12': 0xB,
    '13': 0x0,
    '14': 0x8,
    '15': 0x4,
    '16': 0xC
};


var x10Address = {
    'house': undefined,
    'unit': undefined,

    'SetAddress': SetAddress
};


function SetAddress(house, unit) {
    if(HOUSE_ENCMAP.hasOwnProperty(house) || UNIT_ENCMAP.hasOwnProperty(unit)) {
        this.house = HOUSE_ENCMAP[house];
        this.unit =  UNIT_ENCMAP[unit];
    }
}


function X10Address(house, unit) {
    var address = Object.create(x10Address);
    address.SetAddress(house, unit);
    return address;
}


module.exports = X10Address;
