(function(angular, $) {
    'use strict';
    angular.module('FileManagerApp').controller('FileManagerCtrl', [
        '$scope', '$rootScope', '$window', '$translate', 'fileManagerConfig', 'item', 'fileNavigator', 'apiMiddleware',
        function($scope, $rootScope, $window, $translate, fileManagerConfig, Item, FileNavigator, ApiMiddleware) {

            /**
             * 读取本地storage
             * @type {Storage}
             */
        var $storage = $window.localStorage;
            /**
             * 加载文件管理器配置
             * @type {fileManagerConfig}
             */
        $scope.config = fileManagerConfig;
        $scope.reverse = false;
        $scope.predicate = ['model.type', 'model.name'];
            /**
             * 排序
             * @param predicate
             */
        $scope.order = function(predicate) {
            $scope.reverse = ($scope.predicate[1] === predicate) ? !$scope.reverse : false;
            $scope.predicate[1] = predicate;
        };
            /**
             * 检索
             * @type {string}
             */
        $scope.query = '';
            /**
             * 导航
             * @type {FileNavigator}
             */
        $scope.fileNavigator = new FileNavigator();
            /**
             * web api 中间件
             * @type {ApiMiddleware}
             */
        $scope.apiMiddleware = new ApiMiddleware();
            /**
             * 上传的文件列表
             * @type {*[]}
             */
        $scope.uploadFileList = [];
            /**
             * 预览末班
             * @type {string|string}
             */
        $scope.viewTemplate = $storage.getItem('viewTemplate') || 'main-icons.html';
            /**
             * 文件列表
             * @type {*[]}
             */
        $scope.fileList = [];
        $scope.temps = [];

            /**
             * 添加temps 的监听器
             */
        $scope.$watch('temps', function() {
            if ($scope.singleSelection()) {
                $scope.temp = $scope.singleSelection();
            } else {
                $scope.temp = new Item({rights: 644});
                $scope.temp.multiple = true;
            }
            $scope.temp.revert();
        });

            /**
             * 添加导航刷新监听事件
             */
        $scope.fileNavigator.onRefresh = function() {
            $scope.temps = [];
            $scope.query = '';
            $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
        };

            /**
             * 重新渲染页面
             * @param name
             */
        $scope.setTemplate = function(name) {
            $storage.setItem('viewTemplate', name);
            $scope.viewTemplate = name;
        };

            /**
             * 改变语言
             * @param locale
             * @returns {$translate|Object|string|*}
             */
        $scope.changeLanguage = function (locale) {
            if (locale) {
                $storage.setItem('language', locale);
                return $translate.use(locale);
            }
            $translate.use($storage.getItem('language') || fileManagerConfig.defaultLang);
        };

            /**
             * 获取指定item选择状态
             * @param item
             * @returns {boolean}
             */
        $scope.isSelected = function(item) {
            return $scope.temps.indexOf(item) !== -1;
        };

            /**
             * 是否选择
             * @param item
             * @param $event
             */
        $scope.selectOrUnselect = function(item, $event) {
            /**
             * 选择的索引
             * @type {number}
             */
            var indexInTemp = $scope.temps.indexOf(item);
            var isRightClick = $event && $event.which == 3;

            if ($event && $event.target.hasAttribute('prevent')) {
                $scope.temps = [];
                return;
            }
            /**
             * 是否右键某个item
             */
            if (! item || (isRightClick && $scope.isSelected(item))) {
                return;
            }
            /**
             * 是否按下shift键点右键
             */
            if ($event && $event.shiftKey && !isRightClick) {
                var list = $scope.fileList;
                var indexInList = list.indexOf(item);
                var lastSelected = $scope.temps[0];
                var i = list.indexOf(lastSelected);
                var current = undefined;
                if (lastSelected && list.indexOf(lastSelected) < indexInList) {
                    $scope.temps = [];
                    while (i <= indexInList) {
                        current = list[i];
                        !$scope.isSelected(current) && $scope.temps.push(current);
                        i++;
                    }
                    return;
                }
                if (lastSelected && list.indexOf(lastSelected) > indexInList) {
                    $scope.temps = [];
                    while (i >= indexInList) {
                        current = list[i];
                        !$scope.isSelected(current) && $scope.temps.push(current);
                        i--;
                    }
                    return;
                }
            }
            /**
             * 是否按下ctrl的情况下点击右键
             */
            if ($event && !isRightClick && ($event.ctrlKey || $event.metaKey)) {
                $scope.isSelected(item) ? $scope.temps.splice(indexInTemp, 1) : $scope.temps.push(item);
                return;
            }
            $scope.temps = [item];
        };
            /**
             * 单个选择
             * @returns {boolean|*|Item}
             */
        $scope.singleSelection = function() {
            return $scope.temps.length === 1 && $scope.temps[0];
        };

            /**
             * 总共选择
             * @returns {{total: number}}
             */
        $scope.totalSelecteds = function() {
            return {
                total: $scope.temps.length
            };
        };

            /**
             * 判断选择的类型
             * @param type
             * @returns {T}
             */
        $scope.selectionHas = function(type) {
            return $scope.temps.find(function(item) {
                return item && item.model.type === type;
            });
        };

            /**
             * 准备创建新文件夹
             * @returns {Item}
             */
        $scope.prepareNewFolder = function() {
            var item = new Item(null, $scope.fileNavigator.currentPath);
            $scope.temps = [item];
            return item;
        };

            /**
             * 智能点击
             * @param item
             * @returns {undefined|void}
             */
        $scope.smartClick = function(item) {
            var pick = $scope.config.allowedActions.pickFiles;
            /**
             * item是否是文件夹
             */
            if (item.isFolder()) {
                return $scope.fileNavigator.folderClick(item);
            }

            /**
             * 选择回调
             */
            if (typeof $scope.config.pickCallback === 'function' && pick) {
                var callbackSuccess = $scope.config.pickCallback(item.model);
                if (callbackSuccess === true) {
                    return;
                }
            }

            /**
             * 看item是否是图片
             */
            if (item.isImage()) {
                if ($scope.config.previewImagesInModal) {
                    return $scope.openImagePreview(item);
                } 
                return $scope.apiMiddleware.download(item, true);
            }

            /**
             * item是否可以编辑
             */
            if (item.isEditable()) {
                return $scope.openEditItem(item);
            }
        };

            /**
             * 打开文件预览
             */
        $scope.openImagePreview = function() {
            var item = $scope.singleSelection();
            $scope.apiMiddleware.apiHandler.inprocess = true;
            /**
             * 调文件预览模板
             */
            $scope.modal('imagepreview', null, true)
                .find('#imagepreview-target')
                .attr('src', $scope.apiMiddleware.getUrl(item))
                .unbind('load error')
                .on('load error', function() {
                    $scope.apiMiddleware.apiHandler.inprocess = false;
                    $scope.$apply();
                });
        };

            /**
             * 打开编辑item
             */
        $scope.openEditItem = function() {
            var item = $scope.singleSelection();
            $scope.apiMiddleware.getContent(item).then(function(data) {
                item.tempModel.content = item.model.content = data.result;
            });
            $scope.modal('edit');
        };

            /**
             * 绑定编辑文档组件事件
             */
        $scope.openEditDocumentItem = function() {
            var item = $scope.singleSelection();
            var data = {
                url: $scope.apiMiddleware.getUrl(item),
                filename: item.model.name
            };
            var path = [$scope.config.documentViewUrl, $.param(data)].join('?');
            $("#iframeEditor").attr('src', path);
            $scope.modal('editDoc');
        };

            /**
             * 获取某个元素
             * @param id
             * @param hide
             * @param returnElement
             * @returns {jQuery.fn.init|jQuery|HTMLElement|boolean}
             */
        $scope.modal = function(id, hide, returnElement) {
            var element = $('#' + id);
            element.modal(hide ? 'hide' : 'show');
            $scope.apiMiddleware.apiHandler.error = '';
            $scope.apiMiddleware.apiHandler.asyncSuccess = false;
            return returnElement ? element : true;
        };

            /**
             * 获取某个元素路径选择器
             * @param id
             * @returns {jQuery.fn.init|jQuery|HTMLElement|boolean}
             */
        $scope.modalWithPathSelector = function(id) {
            $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
            return $scope.modal(id);
        };

            /**
             * 判断某个路径是否在此路径
             * @param path
             * @returns {boolean}
             */
        $scope.isInThisPath = function(path) {
            var currentPath = $scope.fileNavigator.currentPath.join('/') + '/';
            return currentPath.indexOf(path + '/') !== -1;
        };

            /**
             * 编辑方法，调用编辑api
             */
        $scope.edit = function() {
            $scope.apiMiddleware.edit($scope.singleSelection()).then(function() {
                $scope.modal('edit', true);
            });
        };

            /**
             * 更改权限
             */
        $scope.changePermissions = function() {
            $scope.apiMiddleware.changePermissions($scope.temps, $scope.temp).then(function() {
                $scope.modal('changepermissions', true);
            });
        };

            /**
             * 下载
             * @returns {undefined|*}
             */
        $scope.download = function() {
            var item = $scope.singleSelection();
            if ($scope.selectionHas('dir')) {
                return;
            }
            if (item) {
                return $scope.apiMiddleware.download(item);
            }
            return $scope.apiMiddleware.downloadMultiple($scope.temps);
        };

            /**
             * 复制文件
             * @returns {boolean}
             */
        $scope.copy = function() {
            var item = $scope.singleSelection();
            if (item) {
                var name = item.tempModel.name.trim();
                var nameExists = $scope.fileNavigator.fileNameExists(name);
                if (nameExists && validateSamePath(item)) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                    return false;
                }
                if (!name) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                    return false;
                }
            }
            $scope.apiMiddleware.copy($scope.temps, $rootScope.selectedModalPath).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('copy', true);
            });
        };

            /**
             * 压缩方法
             * @returns {boolean}
             */
        $scope.compress = function() {
            var name = $scope.temp.tempModel.name.trim();
            var nameExists = $scope.fileNavigator.fileNameExists(name);

            if (nameExists && validateSamePath($scope.temp)) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }
            if (!name) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }

            $scope.apiMiddleware.compress($scope.temps, name, $rootScope.selectedModalPath).then(function() {
                $scope.fileNavigator.refresh();
                if (! $scope.config.compressAsync) {
                    return $scope.modal('compress', true);
                }
                $scope.apiMiddleware.apiHandler.asyncSuccess = true;
            }, function() {
                $scope.apiMiddleware.apiHandler.asyncSuccess = false;
            });
        };

            /**
             * 解压方法
             * @returns {boolean}
             */
        $scope.extract = function() {
            var item = $scope.temp;
            var name = $scope.temp.tempModel.name.trim();
            var nameExists = $scope.fileNavigator.fileNameExists(name);

            if (nameExists && validateSamePath($scope.temp)) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }
            if (!name) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }

            $scope.apiMiddleware.extract(item, name, $rootScope.selectedModalPath).then(function() {
                $scope.fileNavigator.refresh();
                if (! $scope.config.extractAsync) {
                    return $scope.modal('extract', true);
                }
                $scope.apiMiddleware.apiHandler.asyncSuccess = true;
            }, function() {
                $scope.apiMiddleware.apiHandler.asyncSuccess = false;
            });
        };

            /**
             * 移除文件
             */
        $scope.remove = function() {
            $scope.apiMiddleware.remove($scope.temps).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('remove', true);
            });
        };

            /**
             * 移动文件
             * @returns {boolean}
             */
        $scope.move = function() {           
            var anyItem = $scope.singleSelection() || $scope.temps[0];
            if (anyItem && validateSamePath(anyItem)) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_cannot_move_same_path');
                return false;
            }
            $scope.apiMiddleware.move($scope.temps, $rootScope.selectedModalPath).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('move', true);
            });
        };

            /**
             * 文件重命名
             * @returns {boolean}
             */
        $scope.rename = function() {
            var item = $scope.singleSelection();
            var name = item.tempModel.name;
            var samePath = item.tempModel.path.join('') === item.model.path.join('');
            if (!name || (samePath && $scope.fileNavigator.fileNameExists(name))) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }
            $scope.apiMiddleware.rename(item).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('rename', true);
            });
        };

            /**
             * 创建文件夹
             * @returns {string|Object}
             */
        $scope.createFolder = function() {
            var item = $scope.singleSelection();
            var name = item.tempModel.name;
            if (!name || $scope.fileNavigator.fileNameExists(name)) {
                return $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
            }
            $scope.apiMiddleware.createFolder(item).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('newfolder', true);
            });
        };

            /**
             * 添加上传文件
             * @param $files
             */
        $scope.addForUpload = function($files) {
            $scope.uploadFileList = $scope.uploadFileList.concat($files);
            $scope.modal('uploadfile');
        };

            /**
             * 从上传列表中移除文件
             * @param index
             */
        $scope.removeFromUpload = function(index) {
            $scope.uploadFileList.splice(index, 1);
        };

            /**
             * 上传所有文件
             */
        $scope.uploadFiles = function() {
            $scope.apiMiddleware.upload($scope.uploadFileList, $scope.fileNavigator.currentPath).then(function() {
                $scope.fileNavigator.refresh();
                $scope.uploadFileList = [];
                $scope.modal('uploadfile', true);
            }, function(data) {
                var errorMsg = data.result && data.result.error || $translate.instant('error_uploading_files');
                $scope.apiMiddleware.apiHandler.error = errorMsg;
            });
        };

            /**
             * 验证是否是相同的路径
             * @param item
             * @returns {boolean}
             */
        var validateSamePath = function(item) {
            var selectedPath = $rootScope.selectedModalPath.join('');
            var selectedItemsPath = item && item.model.path.join('');
            return selectedItemsPath === selectedPath;
        };

            /**
             * 获取检索参数
             * @param param
             * @returns {string|undefined}
             */
        var getQueryParam = function(param) {
            var found = $window.location.search.substr(1).split('&').filter(function(item) {
                return param ===  item.split('=')[0];
            });
            return found[0] && found[0].split('=')[1] || undefined;
        };

            /**
             * 改变语言，国际化
             */
        $scope.changeLanguage(getQueryParam('lang'));
            /**
             * 是否是窗口模式
             * @type {boolean}
             */
        $scope.isWindows = getQueryParam('server') === 'Windows';
            /**
             * 刷新文件导航列表
             */
        $scope.fileNavigator.refresh();

    }]);
})(angular, jQuery);
//匿名函数立即执行
