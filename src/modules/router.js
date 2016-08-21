'use strict';

const reqHelper = require('./request-helper');
const resHelper = require('./response-helper');

const _routes = [];
let _app;

/**
 * このモジュールを初期化します
 *
 * @param  {any} app 対象のサーバアプリケーション
 */
var init = app => {
	if (app === null)
		throw new Error('routes is unknown type');

	_app = app;

	return this;
};
module.exports = init;

/**
 * ルートを追加します
 *
 * @param  {string[]} route
 * @param  {Function[]} middles
 */
var addRoute = (route, middles) => {
	if (!Array.isArray(route) || route === undefined)
		throw new Error('routes is unknown type');

	if (middles === undefined)
		middles = [];

	var method = route[0];
	const path = route[1];
	var extensions = route[2];

	method = method.replace(/^del$/, 'delete');

	require('methods').forEach(m => {
		if (method.toLowerCase() === m) {
			middles.forEach(middle => {
				_app[m](path, middle);
			});

			_app[m](path, (request, response) => {
				var dirPath = '../routes';

				path.substring(1).split(/\//).forEach((seg, i) => {
					dirPath += '/' + seg.replace(/:/, '');
				});

				reqHelper(request);
				resHelper(response);

				require(dirPath)[m](request, response, extensions);
			});

			_routes.push({method: m.toUpperCase(), path: path, extensions: extensions});
		}
	});
}
exports.addRoute = addRoute;

/**
 * 複数のルートを追加します
 *
 * @param  {string[][]} routes
 * @param  {Function[]} middles
 */
var addRoutes = (routes, middles) => {
	if (!Array.isArray(routes) || routes === undefined)
		throw new Error('routes is unknown type');

	routes.forEach(route => addRoute(route, middles));
};
exports.addRoutes = addRoutes;

/**
 * 該当するルートを取得します
 *
 * @param  {string} method
 * @param  {string} path
 * @return {Object} ルート情報
 */
var findRoute = (method, path) => {
	var result;

	_routes.some((route) => {
		if (method === route.method && path === route.path)
		{
			result = route;
			return true;
		}
	});

	return result;
};
exports.findRoute = findRoute;
