'use strict';

const bodyParser = require('body-parser');
const express = require('express');

const routes = require('./routes');

const loadConfig = require('./helpers/load-config');
const type = require('./helpers/type');

const applicationModel = require('./models/application');
const applicationAccessModel = require('./models/application-access');

const applications = require('./collections/applications');
const users = require('./collections/users');

module.exports = () => {
	console.log('--------------------');
	console.log('  Frost API Server  ');
	console.log('--------------------');

	const config = loadConfig();
	const app = express();
	app.disable('x-powered-by');
	app.use(bodyParser.json());
	var router = require('./helpers/router')(app);

	const checkParams = (request, response, next) => {
		try {
			var extensions = router.findRoute(request.method.toLowerCase(), request.route.path).extensions;

			if ('params' in extensions && extensions.params.length !== 0) {
				for(var param of extensions.params) {
					if (param.type == null || param.name == null) {
						response.status(500).send({error: {message: 'internal error', details: 'extentions.params elements are missing'}});
						throw new Error('extentions.params elements are missing');
					}

					const paramType = param.type;
					const paramName = param.name;
					const isRequire = param.require != null ? param.require === true : true; // requireにtrueが設定されている場合は必須項目になる。デフォルトでtrue

					if (isRequire) {
						if (request.body[paramName] == null) {
							response.status(400).send({error: {message: `parameter '${paramName}' is require`}});
							return;
						}

						if (type(request.body[paramName]).toLowerCase() !== paramType.toLowerCase()) {
							response.status(400).send({error: {message: `type of parameter '${paramName}' is invalid`}});
							return;
						}
					}
				}
			}
		}
		catch(err) {
			console.log('checkParams failed');
			throw err;
		}

		next();
	};

	const checkPermission = (request, response, next) => {
		try {
			(async () => {
				try {
					var route = router.findRoute(request.method, request.route.path);
					var extensions = route.extensions;

					if ('permissions' in extensions && extensions.permissions.length !== 0) {
						const applicationKey = request.get('X-Application-Key');
						const accessKey = request.get('X-Access-Key');

						if (applicationKey == null) {
							response.status(400).send({error: {message: 'X-Application-Key header is empty'}});
							return;
						}

						if (accessKey == null) {
							response.status(400).send({error: {message: 'X-Access-Key header is empty'}});
							return;
						}

						if (!(await applicationModel.verifyApplicationKeyAsync(applicationKey))) {
							response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
							return;
						}

						if (!(await applicationAccessModel.verifyAccessKeyAsync(accessKey))) {
							response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
							return;
						}

						const applicationId = applicationModel.keyToElements(applicationKey).applicationId;
						const userId = applicationAccessModel.keyToElements(accessKey).userId;

						request.application = (await applications()).findAsync({_id: applicationId});
						request.user = await (await users()).findAsync({_id: userId});

						for (var permission of extensions.permissions) {
							if (!request.application.isHasPermission(permission)) {
								response.status(403).send({error: {message: 'you do not have any permissions'}});
								return;
							}
						}

						next();
					}
					else {
						next();
					}
				}
				catch(err) {
					console.log(`checkPermission failed A (${err})`);
					throw err;
				}
			})();
		}
		catch(err) {
			console.log('checkPermission failed B');
			throw err;
		}
	};

	router.addRoutes(routes(), [checkPermission, checkParams]);

	app.listen(config.api.port, () => {
		console.log(`listen on port: ${config.api.port}`);
	});
};