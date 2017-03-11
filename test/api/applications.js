'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const routeAccount = require('../../built/routes/account');
const routeApp = require('../../built/routes/applications');
const routeAppId = require('../../built/routes/applications/id');
const routeAppIdApplicationKey = require('../../built/routes/applications/id/application_key');
const dbConnector = require('../../built/helpers/dbConnector')();

describe('API', () => {
	let dbManager;
	before(done => {
		(async () => {
			try {
				config.api.database = config.api.testDatabase;
				dbManager = await dbConnector.connectApidbAsync(config);

				done();
			}
			catch(e) {
				done(e);
			}
		})();
	});

	describe('POST /applications', () => {
		let user;
		before(done => {
			(async () => {
				try {
					const res = await routeAccount.post({
						body: {
							screenName: 'testuser',
							password: 'abcdefg',
							name: 'froster',
							description: 'this is testuser.'
						}
					}, null, config);
					assert.equal(res.statusCode, 200);
					user = res.data.user;

					done();
				}
				catch(e) {
					done(e);
				}
			})();

		});

		afterEach(done => {
			(async () => {
				try {
					await dbManager.removeAsync('applications', {});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		after(done => {
			(async () => {
				try {
					await dbManager.removeAsync('users', {});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		it('正しくリクエストされた場合は成功する', done => {
			(async () => {
				try {
					let res = await routeApp.post({
						user: {id: user.id},
						application: {
							permissions: []
						},
						body: {
							name: 'hoge',
							description: 'hogehoge',
							permissions: []
						}
					}, null, config);

					assert.equal(res.statusCode, 200);

					delete res.data.application.id;
					assert.deepEqual(res.data, {
						application: {
							name: 'hoge',
							creatorId: user.id,
							description: 'hogehoge',
							permissions: []
						}
					});
					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		it('nameが空もしくは33文字以上の場合は失敗する', done => {
			(async () => {
				try {
					let res = await routeApp.post({
						user: {id: user.id},
						application: {
							permissions: []
						},
						body: {
							name: '',
							description: 'hogehoge',
							permissions: ''
						}
					}, null, config);
					assert.equal(res.statusCode, 400);

					res = await routeApp.post({
						user: {id: user.id},
						application: {
							permissions: []
						},
						body: {
							name: 'superFrostersuperFrostersuperFros',
							description: 'hogehoge',
							permissions: ''
						}
					}, null, config);
					assert.equal(res.statusCode, 400);

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		it('descriptionが257文字以上のときは失敗する', done => {
			(async () => {
				try {
					let res = await routeApp.post({
						user: {id: user.id},
						application: {
							permissions: []
						},
						body: {
							name: 'hoge',
							description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget',
							permissions: ''
						}
					}, null, config);
					assert.equal(res.statusCode, 400);

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});
	});

	describe('GET  /applications/id', () => {
		it('正しくリクエストされた場合は成功する', done => {
			(async () => {
				try {
					let res = await routeAppId.get({params: {id: 'application_id_hoge'}}, null, config);

					assert.equal(res.statusCode, 200);

					delete res.data.application.id;
					assert.deepEqual(res.data, {
						application: {
							name: 'hoge',
							creatorId: '1234abcd',
							description: 'hogehoge',
							permissions: []
						}
					});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});
	});

	describe('POST /applications/id/application_key', () => {
		it('正しくリクエストされた場合は成功する', done => {
			(async () => {
				try {
					let res = await routeAppIdApplicationKey.post({params: {id: 'application_id_hoge'}}, null, config);

					assert.equal(res.statusCode, 200);

					assert.deepEqual(res.data, {
						application_key: 'application_key_hoge'
					});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});
	});

	describe('GET  /applications/id/application_key', () => {
		it('正しくリクエストされた場合は成功する', done => {
			(async () => {
				try {
					let res = await routeAppIdApplicationKey.get({params: {id: 'application_id_hoge'}}, null, config);

					assert.equal(res.statusCode, 200);

					assert.deepEqual(res.data, {
						application_key: 'application_key_hoge'
					});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});
	});
});
