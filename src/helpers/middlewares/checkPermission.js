'use strict';

const applicationModelAsync = require('../../models/application');
const applicationAccessModelAsync = require('../../models/applicationAccess');

const applications = require('../collections').applications;
const users = require('../collections').users;

module.exports = async (config, router) => {
	const instance = {};

	const applicationModel = await applicationModelAsync(config);
	const applicationAccessModel = await applicationAccessModelAsync(config);

	instance.execute = (request, response, next) => {
		try {
			(async () => {
				try {
					const route = router.findRoute(request.method, request.route.path);
					const extensions = route.extensions;

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

						if (!(await applicationModel.verifyKeyAsync(applicationKey))) {
							response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
							return;
						}

						if (!(await applicationAccessModel.verifyKeyAsync(accessKey))) {
							response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
							return;
						}

						const applicationId = applicationModel.splitKey(applicationKey).applicationId;
						const userId = applicationAccessModel.splitKey(accessKey).userId;

						request.application = (await applications()).findIdAsync(applicationId);
						request.user = await (await users()).findIdAsync(userId);

						for (const permission of extensions.permissions) {
							if (!await request.application.hasPermissionAsync(permission)) {
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
			console.log('checkPermission failed B (${err})');
			throw err;
		}
	};

	return instance;
};
