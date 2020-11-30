(function(angular) {
    'use strict';
    /**
     * 注册item类模块
     */
    angular.module('FileManagerApp').factory('item', ['fileManagerConfig', 'chmod', function(fileManagerConfig, Chmod) {

        /**
         * 构造方法
         * @param model
         * @param path
         * @constructor
         */
        var Item = function(model, path) {
            var rawModel = {
                name: model && model.name || '',
                path: path || [],
                type: model && model.type || 'file',
                size: model && parseInt(model.size || 0),
                date: parseMySQLDate(model && model.date),
                perms: new Chmod(model && model.rights),
                content: model && model.content || '',
                recursive: false,
                fullPath: function() {
                    var path = this.path.filter(Boolean);
                    return ('/' + path.join('/') + '/' + this.name).replace(/\/\//, '/');
                }
            };

            this.error = '';
            this.processing = false;

            this.model = angular.copy(rawModel);
            this.tempModel = angular.copy(rawModel);

            function parseMySQLDate(mysqlDate) {
                var d = (mysqlDate || '').toString().split(/[- :]/);
                return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]);
            }
        };

        /**
         * 添加更新方法
         */
        Item.prototype.update = function() {
            angular.extend(this.model, angular.copy(this.tempModel));
        };

        /**
         * 恢复
         */
        Item.prototype.revert = function() {
            angular.extend(this.tempModel, angular.copy(this.model));
            this.error = '';
        };

        /**
         * 是否是文件夹
         * @returns {boolean}
         */
        Item.prototype.isFolder = function() {
            return this.model.type === 'dir';
        };

        /**
         * 是否可编辑
         * @returns {boolean}
         */
        Item.prototype.isEditable = function() {
            return !this.isFolder() && fileManagerConfig.isEditableFilePattern.test(this.model.name);
        };

        /**
         * 是否是文档对象
         * @returns {boolean}
         */
        Item.prototype.isDocument = function() {
            return !this.isFolder() && fileManagerConfig.isDocumentFilePattern.test(this.model.name);
        };

        /**
         * 是否是图片
         * @returns {boolean}
         */
        Item.prototype.isImage = function() {
            return fileManagerConfig.isImageFilePattern.test(this.model.name);
        };

        /**
         * 是否是可以压缩
         * @returns {boolean}
         */
        Item.prototype.isCompressible = function() {
            return this.isFolder();
        };

        /**
         * 是否可解压
         * @returns {boolean}
         */
        Item.prototype.isExtractable = function() {
            return !this.isFolder() && fileManagerConfig.isExtractableFilePattern.test(this.model.name);
        };

        /**
         * 能否被选择
         * @returns {boolean}
         */
        Item.prototype.isSelectable = function() {
            return (this.isFolder() && fileManagerConfig.allowedActions.pickFolders) || (!this.isFolder() && fileManagerConfig.allowedActions.pickFiles);
        };

        return Item;
    }]);
})(angular);