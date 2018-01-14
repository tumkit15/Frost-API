const ApiContext = require('../../../../modules/ApiContext');
const MongoAdapter = require('../../../../modules/MongoAdapter');
const v = require('validator');
const $ = require('cafy').default;

// TODO: カーソル送り

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' },
			cursor: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	const limit = v.toInt(apiContext.query.limit);
	const cursor = MongoAdapter.buildId(apiContext.query.cursor);

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	// このユーザーを対象とするフォロー関係をすべて取得
	const userFollowings = await apiContext.userFollowingsService.findTargets(user._id, limit);
	if (userFollowings.length == 0) {
		apiContext.response(204);
		return;
	}

	// fetch and serialize users
	const promises = userFollowings.map(async following => {
		const user = await apiContext.repository.findById('users', following.target);
		if (user == null) {
			console.log(`notfound following target userId: ${following.target.toString()}`);
			return;
		}
		return apiContext.usersService.serialize(user);
	});
	const serializedUsers = await Promise.all(promises);

	apiContext.response(200, { users: serializedUsers });
};
