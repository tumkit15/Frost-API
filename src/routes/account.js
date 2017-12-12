const User = require('../documentModels/user');
const $ = require('cafy').default;
const { ApiError } = require('../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			screenName: { cafy: $().string() },
			password: { cafy: $().string() },
			description: { cafy: $().string().range(0, 256), default: '' },
			name: { cafy: $().string().range(1, 32), default: 'froster' }
		}, permissions: ['accountSpecial']
	});

	const {
		screenName,
		password,
		name,
		description
	} = apiContext.body;

	// screenName
	if (!User.checkFormatScreenName(screenName)) {
		throw new ApiError(400, 'screenName is invalid format');
	}

	// check validation
	if (apiContext.config.api.invalidScreenNames.some(invalidScreenName => screenName == invalidScreenName)) {
		throw new ApiError(400, 'screenName is invalid');
	}

	// check duplication
	if (await User.findByScreenNameAsync(screenName, apiContext.db, apiContext.config) != null) {
		throw new ApiError(400, 'this screenName is already exists');
	}

	// password
	if (!User.checkFormatPassword(password)) {
		throw new ApiError(400, 'password is invalid format');
	}

	let user = await apiContext.db.users.createAsync(screenName, password, name, description);

	if (user == null) {
		throw new ApiError(500, 'failed to create account');
	}

	apiContext.response(200, {user: user.serialize()});
};
