/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

var exec = cordova.require('cordova/exec'); // eslint-disable-line no-undef
var utils = require('cordova/utils');
var PositionError = require('./PositionError');

// Native watchPosition method is called async after permissions prompt.
// So we use additional map and own ids to return watch id synchronously.
var pluginToNativeWatchMap = {};

module.exports = {
    getCurrentPosition: function (success, error, args) {
        var win = function (deviceApiLevel) {
            if (deviceApiLevel === 31) args.enableHighAccuracy = true; // Workaround for bug specific to API 31 where requesting `enableHighAccuracy: false` results in TIMEOUT error.
            var geo = cordova.require('cordova/modulemapper').getOriginalSymbol(window, 'navigator.geolocation'); // eslint-disable-line no-undef
            geo.getCurrentPosition(success, error, args);
        };
        var fail = function(e) {
            if (error) {
                error(new PositionError (PositionError.PERMISSION_DENIED, e));
            }
        };
        exec(win, fail, 'Geolocation', 'getPermission', [args.enableHighAccuracy]);
    },

    watchPosition: function (success, error, args) {
        var pluginWatchId = utils.createUUID();

        var win = function (deviceApiLevel) {
            if (deviceApiLevel === 31) args.enableHighAccuracy = true; // Workaround for bug specific to API 31 where requesting `enableHighAccuracy: false` results in TIMEOUT error.
            var geo = cordova.require('cordova/modulemapper').getOriginalSymbol(window, 'navigator.geolocation'); // eslint-disable-line no-undef
            pluginToNativeWatchMap[pluginWatchId] = geo.watchPosition(success, error, args);
        };

        var fail = function(e) {
            if (error) {
                error(new PositionError(PositionError.PERMISSION_DENIED, e));
            }
        };
        exec(win, fail, 'Geolocation', 'getPermission', [args.enableHighAccuracy]);

        return pluginWatchId;
    },

    clearWatch: function (pluginWatchId) {
        var nativeWatchId = pluginToNativeWatchMap[pluginWatchId];
        var geo = cordova.require('cordova/modulemapper').getOriginalSymbol(window, 'navigator.geolocation'); // eslint-disable-line no-undef
        geo.clearWatch(nativeWatchId);
    }
};