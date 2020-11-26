/******************************************************************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Alan Thiessen
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
        'init': Init,
        'run': Run,
        'start': Start,
        'handleMessage': HandleMessage,
        'done': Done,
        'error': Error
    };


    /***
     * @param ctrl
     * @param start - Must be a real function
     * @param rxCallback - Can be null or a function reference
     */
    function Init(ctrl, start, rxCallback) {
        if(typeof(start) !== 'function') {
            throw("Transaction: Expected 'start' to be a function");
        }
        else if((rxCallback !== null) && (typeof(rxCallback) !== 'function')) {
            throw("Transaction: Expected 'rxCallback' to be a function");
        }
        else {
            this.promise = undefined;
            this.ctrl = ctrl;
            this.startCallback = start;
            this.rxCallback = rxCallback;
        }
    }

    function Run() {
        let trans = this;

        return new Promise(function(resolve, reject) {
            trans.resolve = resolve;
            trans.reject = reject;
            trans.start();
        });
    }


    function Done(status) {
        if(this.resolve) {
            this.resolve(status);
        }
    }


    function Error(error) {
        console.log('Transaction Failed: ' + error);

        if(this.reject) {
            this.reject(error);
        }
    }


    function Start() {
        if(typeof(this.startCallback) === 'function') {
            this.startCallback();
        }
        else {
            this.done();
        }
    }


    function HandleMessage(data) {
        if(typeof(this.rxCallback) === 'function') {
            return this.rxCallback(data);
        }
        else {
            return false;
        }
    }


    /***
     * @param ctrl
     * @param start
     * @param rxCallBack
     * @returns {TransactionObj}
     * @constructor
     */
    function Transaction(ctrl, start, rxCallBack) {
        let trans = Object.create(TransactionObj);
        trans.init(ctrl, start, rxCallBack);
        return trans;
    }

    module.exports = Transaction;

})();
