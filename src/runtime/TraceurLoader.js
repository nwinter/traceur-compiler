// Copyright 2012 Traceur Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import {InternalLoader} from '../runtime/InternalLoader';
import {Loader} from '../runtime/Loader';

export class TraceurLoader extends Loader {

  /**
   * @param {!Object=} loaderHooks
   */
  constructor(loaderHooks) {
    super(loaderHooks);
  }

  /**
   * See https://github.com/jorendorff/js-loaders/issues/92
   * loadAsScript - Asynchronously load and run a script. If the script
   * calls Loader.import(),  this can cause modules to be loaded, linked,
   * and evaluated.
   *
   * This function is the same as import(), with one exception: the text of
   * the initial load is parsed to goal 'Script' rather than 'Module'
   *
   * On success, pass the result of evaluating the script to the success
   * callback.
   * @param {string} name, relative path to js file.
   */
  loadAsScript(filename,
       {referrerName, address} = {},
       callback = (result) => {},
       errback = (ex) => { throw ex; }) {
    var name = filename.replace(/\.js$/, '');
    var codeUnit = this.internalLoader_.load(name, referrerName,
        address, 'script');
    codeUnit.addListener(function(result) {
      callback(result);
    }, errback);
  }

  /**
   * script - Evaluate the source as a 'script'. Same as function module(),
   * but the source is parsed as 'script' rather than 'module'.
   *
   * This function is similar to built-in eval() except that all the Loader
   * callbacks, eg translate() are applied before evaluation.
   *
   * src may import modules, but if it directly or indirectly imports a module
   * that is not already loaded, a SyntaxError is thrown.
   *
   * @param {string} source The source code to eval.
   * @return {*} The completion value of evaluating the code.
   */
  script(source,
      {referrerName, address} = {},
      callback = (result) => {},
      errback = (ex) => { throw ex; }) {
    try {
      var codeUnit =
          this.internalLoader_.script(source, null, referrerName, address);
      callback(codeUnit.result);
    } catch (ex) {
      errback(ex);
    }
  }

  semVerRegExp_() {
    return /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;
  }

  /**
   * @param {string} normalizedName, eg traceur@0.0.13/...
   * @return {Object} 3 properties, eg traceur@, traceur@0, traceur@0.0,
   *   all set to the first segment of the normalizedName.
   */
  semverMap(normalizedName) {
    var slash = normalizedName.indexOf('/');
    var version = normalizedName.slice(0, slash);
    var at = version.indexOf('@');
    if (at !== -1) {
      var semver = normalizedName.slice(at + 1, slash);
      var m = this.semVerRegExp_().exec(semver);
      if (m) {
        var major = m[1];
        var minor = m[2];
        var packageName = version.slice(0, at);
        var map = Object.create(null);
        map[packageName] = version;
        map[packageName + '@' + major] = version;
        map[packageName + '@' + major + '.' + minor] = version;
      }
    }
    return map;
  }
}