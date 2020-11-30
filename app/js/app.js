/**
 * 立即执行函数，程序入口
 */
(function(window, angular, $) {
    'use strict';
    /**
     * 在angular 中添加一个模块
     */
    angular.module('FileManagerApp', ['pascalprecht.translate', 'ngFileUpload']);

    /**
     * 给document对象绑定一个事件
     */
    $(window.document).on('shown.bs.modal', '.modal', function() {
        window.setTimeout(function() {
            $('[autofocus]', this).focus();
        }.bind(this), 100);
    });

    /**
     * 绑定页面点击事件
     */
    $(window.document).on('click', function() {
        $('#context-menu').hide();
    });

    /**
     * 绑定菜单事件
     */
    $(window.document).on('contextmenu', '.main-navigation .table-files tr.item-list:has("td"), .item-list', function(e) {
        /**
         * 获取菜单html节点
         * @type {jQuery.fn.init|jQuery|HTMLElement}
         */
        var menu = $('#context-menu');

        if (e.pageX >= window.innerWidth - menu.width()) {
            e.pageX -= menu.width();
        }
        if (e.pageY >= window.innerHeight - menu.height()) {
            e.pageY -= menu.height();
        }

        /**
         * 隐藏菜单
         */
        menu.hide().css({
            left: e.pageX,
            top: e.pageY
        }).show();
        /**
         * 阻止默认事件
         */
        e.preventDefault();
    });

    /**
     * 给数组类型添加一个find 原型方法
     */
    if (! Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            /**
             * 位移
             */
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            /**
             * 返回undefined
             */
            return undefined;
        };
    }
})(window, angular, jQuery);
// 立即执行函数，绑定jquery 和 angular
