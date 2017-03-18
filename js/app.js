(function () {

    'use strict';

    angular.module('saber', ['ngRoute'])
        .run(function ($rootScope) {
            $rootScope.pageName = 'HOME';
        });

    angular.module('saber')
        .config(function ($routeProvider) {

            $routeProvider.when('/home', {
                templateUrl: 'view/home.html',
                controller: 'SaberController',
                pageName: 'HOME'
            });

            $routeProvider.when('/introducao', {
                templateUrl: 'view/introducao.html',
                controller: 'SaberController',
                pageName: 'INTRO'
            });

            $routeProvider.when('/inicio', {
                templateUrl: 'view/inicio.html',
                controller: 'SaberController',
                pageName: 'INICIO'
            });

            $routeProvider.when('/exercicios', {
                templateUrl: 'view/exercicios.html',
                controller: 'SaberController',
                pageName: 'EXERCS'
            });

            $routeProvider.when('/sobre', {
                templateUrl: 'view/sobre.html',
                controller: 'SaberController',
                pageName: 'SOBRE'
            });

            $routeProvider.otherwise({
                redirectTo: '/home'
            });
        });

    angular.module('saber')
        .controller('SaberController', function ($rootScope, $route) {
            $rootScope.pageName = $route.current.$$route.pageName;
        });

})();