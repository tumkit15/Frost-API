const User = require('../../../../documentModels/user');
const UserFollowing = require('../../../../documentModels/userFollowing');
const timelineAsync = require('../../../../modules/timelineAsync');
const v = require('validator');
const $ = require('cafy').default;

// TODO: 不完全な実装

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' }
		},
		permissions: ['postRead', 'userRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	apiContext.query.limit = v.toInt(apiContext.query.limit);

	try {
		// user
		const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
		if (user == null) {
			return apiContext.response(404, 'user as premise not found');
		}

		// ids
		const followings = await UserFollowing.findTargetsAsync(user.document._id, null, apiContext.db, apiContext.config);
		const ids = (followings != null) ? followings.map(i => i.document.target) : [];
		ids.push(user.document._id); // ソースユーザーを追加

		return await timelineAsync(apiContext, 'status', ids, apiContext.query.limit);
	}
	catch (err) {
		console.log(err);
	}
};
