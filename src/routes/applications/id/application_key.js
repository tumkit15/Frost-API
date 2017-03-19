'use strict';

const ApiResult = require('../../../helpers/apiResult');

exports.get = async (request) => {
	const application = await request.db.applications.findIdAsync(request.params.id);

	if (application == null)
		return new ApiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうか
	if (application.document.creatorId.toString() !== request.user.document._id.toString())
		return new ApiResult(400, 'you do not own this application');

	if (application.document.keyCode == null)
		return new ApiResult(400, 'application_key has not been generated yet');

	const key = application.getApplicationKey();

	return new ApiResult(200, {'application_key': key});
};

exports.post = async (request) => {
	const application = await request.db.applications.findIdAsync(request.params.id);

	if (application == null)
		return new ApiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうか
	if (application.document.creatorId.toString() !== request.user.document._id.toString())
		return new ApiResult(400, 'you do not own this application');

	const key = await application.generateApplicationKeyAsync();

	return new ApiResult(200, {'application_key': key});
};
