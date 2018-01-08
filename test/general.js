const assert = require('assert');
const config = require('../src/modules/loadConfig')();
const Route = require('../src/modules/route');

describe('General Tests', () => {
	describe('routes', () => {
		const routeList = require('../src/routeList');

		it('存在するHTTPメソッドを利用している', () => {
			for (const route of routeList) {
				let method = route[0];
				assert(require('methods').indexOf(method) > -1);
			}
		});

		it('すべての対象ルートのモジュールが存在している', () => {
			let errorCount = 0;
			for (const route of routeList) {
				const routeInstance = new Route(route[0], route[1]);
				let routeModule;

				try {
					routeModule = require(routeInstance.getModulePath())[routeInstance.method];
				}
				catch (e) {
					routeModule = null;
				}

				if (routeModule == null) {
					console.log('route module not found:', route[0], route[1]);
					errorCount++;
				}
			}
			assert.equal(errorCount, 0);
		});
	});

	describe('randomRange', () => {
		const random = require('../src/modules/randomRange');

		it('範囲を指定して生成した乱数の値はその範囲内にある', () => {
			for (let i = 0; i < 1000; i++) {
				const value = random(64, 1024);
				assert(value >= 64 && value <= 1024);
			}
		});
	});

	describe('database', () => {
		const DbProvider = require('../src/modules/dbProvider');
		let testDb;

		it('DBに接続してそのインスタンスが取得できる', async () => {
			const authenticate = config.api.testDatabase.password != null ? `${config.api.testDatabase.username}:${config.api.testDatabase.password}` : config.api.testDatabase.username;
			testDb = await DbProvider.connectAsync(config.api.testDatabase.host, config.api.testDatabase.database, authenticate);
			assert(testDb != null);
		});

		it('DBのコレクションにドキュメントを作成できる', async () => {
			assert(testDb != null);
			const document = await testDb.createAsync('hoges', { piyo: 'fuga', nyao: 'nya' });
			assert(document != null);
		});

		it('DBのコレクションからドキュメントを取り出すことができる', async () => {
			assert(testDb != null);
			const document = await testDb.findAsync('hoges', { piyo: 'fuga' });
			assert('nyao' in document && document.nyao === 'nya');
		});

		it('DBのコレクションからドキュメントを削除することができる', async () => {
			assert(testDb != null);
			await testDb.removeAsync('hoges', { piyo: 'fuga' });
			assert((await testDb.findArrayAsync('hoges', { piyo: 'fuga' })).length === 0);
		});

		describe('ドキュメント作成と取り出し', () => {
			afterEach(async () => {
				await testDb.removeAsync('hoges', { piyo: 'fuga' });
			});

			it('テキスト', async () => {
				const document1 = await testDb.createAsync('hoges', { piyo: 'fuga', nyao: 'nya' });
				const document2 = await testDb.findAsync('hoges', { piyo: 'fuga' });

				assert.deepEqual(document1, document2);
			});

			it('バイナリ', async () => {
				const buf = Buffer.from('aG9nZWhvZ2U=', 'base64');
				const document1 = await testDb.createAsync('hoges', { piyo: 'fuga', nyao: buf });
				const document2 = await testDb.findAsync('hoges', { piyo: 'fuga' });

				assert.deepEqual(document1, document2);
			});
		});
	});
});
