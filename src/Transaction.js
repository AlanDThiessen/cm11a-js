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

    var TransactionObj = {
        init: Init,
        Start: function() {},
        HandleMessage: function(message) {},
        IsComplete: function() { return false; }
    };


    function Init(ctrl, start, rxCallback, isComplete) {
        if(typeof(start) !== 'function') {
            throw("Transaction: Expected 'start' to be a function");
        }
        else if(typeof(rxCallback) !== 'function') {
            throw("Transaction: Expected 'rxCallback' to be a function");
        }
        else if(typeof(isComplete) !== 'function') {
            throw("Transaction: Expected 'isComplete' to be a function");
        }
        else {
            this.ctrl = ctrl;
            this.Start = start;
            this.HandleMessage = rxCallback;
            this.IsComplete = isComplete;
        }
    }


    function Transaction(ctrl, start, rxCallBack, isComplete) {
        var trans = Object.create(TransactionObj);
        trans.Init(start, rxCallBack, isComplete);
        return trans;
    }

    module.exports = Transaction;

})();
