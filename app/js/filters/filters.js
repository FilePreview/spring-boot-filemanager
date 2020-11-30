/**
 * 过滤器
 */
(function(angular) {
    'use strict';
  /**
   * 在app 上添加过滤器组件
   * @type {angular.Module}
   */
  var app = angular.module('FileManagerApp');

  /**
   * 通过字符串大小限制过滤，
   */
    app.filter('strLimit', ['$filter', function($filter) {
      /**
       * 构造一个过滤方法
       */
        return function(input, limit, more) {
            if (input.length <= limit) {
                return input;
            }
            return $filter('limitTo')(input, limit) + (more || '...');
        };
    }]);

  /**
   * 通过文件扩展名过滤，构造一个过滤方法
   */
  app.filter('fileExtension', ['$filter', function($filter) {
        return function(input) {
            return /\./.test(input) && $filter('strLimit')(input.split('.').pop(), 3, '..') || '';
        };
    }]);

  /**
   * 根据格式化日期过滤
   */
    app.filter('formatDate', ['$filter', function() {
        return function(input) {
            return input instanceof Date ?
                input.toISOString().substring(0, 19).replace('T', ' ') :
                (input.toLocaleString || input.toString).apply(input);
        };
    }]);

  /**
   * 根据文件大小过滤
   */
  app.filter('humanReadableFileSize', ['$filter', 'fileManagerConfig', function($filter, fileManagerConfig) {
      // See https://en.wikipedia.org/wiki/Binary_prefix
    /**
     * 文件大小单元
     * @type {string[]}
     */
      var decimalByteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    /**
     * 文件二进制大小单元
     * @type {string[]}
     */
      var binaryByteUnits = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

      return function(input) {
        var i = -1;
        var fileSizeInBytes = input;

        do {
          fileSizeInBytes = fileSizeInBytes / 1024;
          i++;
        } while (fileSizeInBytes > 1024);

        var result = fileManagerConfig.useBinarySizePrefixes ? binaryByteUnits[i] : decimalByteUnits[i];
        return Math.max(fileSizeInBytes, 0.1).toFixed(1) + ' ' + result;
      };
    }]);
})(angular);
