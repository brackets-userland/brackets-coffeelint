/*global $, brackets, define*/

define(function (require, exports, module) {
  'use strict';

  // imports
  var CodeInspection = brackets.getModule('language/CodeInspection');
  var ProjectManager = brackets.getModule('project/ProjectManager');
  var ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
  var NodeDomain = brackets.getModule('utils/NodeDomain');

  // constants
  var LINTER_NAME = 'CoffeeLint';
  var nodeDomain = new NodeDomain('zaggino.brackets-coffeelint', ExtensionUtils.getModulePath(module, 'domain'));

  // this will map ESLint output to match format expected by Brackets
  function remapResults(results) {
    return {
      errors: results.map(function (result) {
        var message = result.message;
        if (result.context) {
          message += ' (' + result.context + ')';
        }
        if (result.name) {
          message += ' [' + result.name + ']';
        }
        return {
          message: message,
          pos: {
            line: result.lineNumber - 1,
            ch: result.column
          },
          type: result.rule
        };
      })
    };
  }

  function handleLintSync(text, fullPath) {
    throw new Error(LINTER_NAME + ' sync is not available, use async for ' + fullPath);
  }

  function handleLintAsync(text, fullPath) {
    var deferred = new $.Deferred();
    var projectRoot = ProjectManager.getProjectRoot().fullPath;

    nodeDomain.exec('lintFile', fullPath, projectRoot)
      .then(function (results) {
        deferred.resolve(remapResults(results));
      }, function (err) {
        deferred.reject(err);
      });

    return deferred.promise();
  }

  // register a linter with CodeInspection
  ['coffeescript', 'coffeescriptimproved'].forEach(function (langId) {
    CodeInspection.register(langId, {
      name: LINTER_NAME,
      scanFile: handleLintSync,
      scanFileAsync: handleLintAsync
    });
  });

});
