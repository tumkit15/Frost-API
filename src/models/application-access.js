'use strict';

const crypto = require('crypto');
const ObjectId = require('mongodb').ObjectId;

const config = require('../helpers/load-config')();
const dbConnector = require('../helpers/db-connector')();

const buildAccessKeyHash = (applicationId, userId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secret_token.application_access}/${applicationId.toString()}/${userId.toString()}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildAccessKeyHash = buildAccessKeyHash;

const buildAccessKey = (applicationId, userId, keyCode) => {
	return `${userId}-${buildAccessKeyHash(applicationId, userId, keyCode)}.${keyCode}`;
};
exports.buildAccessKey = buildAccessKey;

const keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

	if (reg == null)
		throw new Error('access key is invalid format');

	return {userId: new ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
};
exports.keyToElements = keyToElements;

exports.verifyAccessKeyAsync = async (key) => {
	let elements;

	try {
		elements = keyToElements(key);
	}
	catch (err) {
		return false;
	}

	const dbManager = await dbConnector.connectApidbAsync();
	const doc = await dbManager.findAsync('applicationAccesses', {user_id: elements.userId, key_code: elements.keyCode});

	if (doc == null)
		return false;

	const correctKeyHash = buildAccessKeyHash(doc.application_id, elements.userId, elements.keyCode);
	const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.key_code;

	return isPassed;
};