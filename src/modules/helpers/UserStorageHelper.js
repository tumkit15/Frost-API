class UserStorageHelper {
	static async getUsedSpace(userId, db) {
		let files;
		try {
			files = await db.storageFiles.findArrayAsync({
				creator: {
					type: 'user',
					id: userId
				}
			});
		}
		catch (err) {
			console.log(err);
		}

		if (!Array.isArray(files)) {
			return 0;
		}

		let usedSpace = 0;
		for (const file of files) {
			usedSpace += file.fileData.length();
		}

		return usedSpace;
	}
}
module.exports = UserStorageHelper;
