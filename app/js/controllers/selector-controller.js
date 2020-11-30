(function(angular) {
    'use strict';
    /**
     * 注册选择器控制器模块
     */
    angular.module('FileManagerApp').controller('ModalFileManagerCtrl', 
        ['$scope', '$rootScope', 'fileNavigator', function($scope, $rootScope, FileNavigator) {

        $scope.reverse = false;
        $scope.predicate = ['model.type', 'model.name'];
            /**
             * 实例化一个文件导航列表
             * @type {FileNavigator}
             */
        $scope.fileNavigator = new FileNavigator();
            /**
             * 选择路径
             * @type {*[]}
             */
        $rootScope.selectedModalPath = [];

            /**
             * 排序
             * @param predicate
             */
        $scope.order = function(predicate) {
            $scope.reverse = ($scope.predicate[1] === predicate) ? !$scope.reverse : false;
            $scope.predicate[1] = predicate;
        };

            /**
             * 选择
             * @param item
             */
        $scope.select = function(item) {
            $rootScope.selectedModalPath = item.model.fullPath().split('/');
            $scope.modal('selector', true);
        };
            /**
             * 选择当前
             */
        $scope.selectCurrent = function() {
            $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
            $scope.modal('selector', true);
        };

            /**
             * 选择某路径的子文件
             * @param item
             * @returns {T}
             */
        $scope.selectedFilesAreChildOfPath = function(item) {
            var path = item.model.fullPath();
            return $scope.temps.find(function(item) {
                var itemPath = item.model.fullPath();
                if (path == itemPath) {
                    return true;
                }
                /*
                if (path.startsWith(itemPath)) {
                    fixme names in same folder like folder-one and folder-one-two
                    at the moment fixed hidding affected folders
                }
                */
            });
        };

            /**
             * 打开文件导航
             * @param path
             */
        $rootScope.openNavigator = function(path) {
            $scope.fileNavigator.currentPath = path;
            $scope.fileNavigator.refresh();
            $scope.modal('selector');
        };

            /**
             * 获取当期那选择的路径
             * @returns {string}
             */
        $rootScope.getSelectedPath = function() {
            var path = $rootScope.selectedModalPath.filter(Boolean);
            var result = '/' + path.join('/');
            if ($scope.singleSelection() && !$scope.singleSelection().isFolder()) {
                result += '/' + $scope.singleSelection().tempModel.name;
            }
            return result.replace(/\/\//, '/');
        };

    }]);
})(angular);