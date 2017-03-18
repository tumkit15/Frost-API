'use strict';

const ApiResult = require('../../helpers/apiResult');
const Application = require('../../documentModels/application');

exports.post = async (request, extensions, db, config) => {
	const userId = request.user._id;
	const name = request.body.name;
	let description = request.body.description;
	const permissions = request.body.permissions;

	// name
	if (!/^.{1,32}$/.test(name))
		return new ApiResult(400, 'name is invalid format');

	if (await db.applications.findAsync({name: name}) != null)
		return new ApiResult(400, 'already exists name');

	// description
	if (description == null)
		description = '';
	if (!/^.{0,256}$/.test(description))
		return new ApiResult(400, 'description is invalid format');

	// permissions
	if (!Application.analyzePermissions(permissions, db, config))
		return new ApiResult(400, 'permissions is invalid format');

	let application;

	try {
		application = await db.applications.createAsync({
			name: name,
			creatorId: userId,
			description: description,
			permissions: permissions
		});
	}
	catch(err) {
		return new ApiResult(500, 'faild to create application');
	}

	if (application == null)
		return new ApiResult(500, 'faild to create application');

	return new ApiResult(200, 'success', {application: application.serialize()});
};
