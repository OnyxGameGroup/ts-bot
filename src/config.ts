export default {
	/**
	 * Discord bot token
	 */
	token: "NjYwNDgzNTU5MzMyNzczODk4.GTfDbo.LI6QbY9QFFjaVXSB2-pztaL7gg5An4YJvLbFsQ",

	/**
	 * Express server port
	 */
	port: 48008,

	/**
	 * Express auth
	 */
	authentication: "8WsCGXnp6uRgu3D",

	/**
	 * MongoDB database name
	 */
	dbName: "default",

	/**
	 * MongoDB URL
	 */
	mongoURL: "mongodb://admin:HtgTshTdFH5JxzJ@127.0.0.1:27017",

	/**
	 * Maximum amount of moderations to be shown in the /search command
	 */
	maxModerationsInSearch: 500,

	/**
	 * Maximum amount of moderations in one /search page
	 */
	maxModerationsInPage: 20,

	whitelist: {
		/**
		 * User IDs of whom can use the /delete command
		 */
		deletePermissions: ["420197112068964353", "449250687868469258", "476824653789134862"],

		/**
		 * The ID of the guild that commands can only be run in
		 */
		targetGuild: "1153021234083278970",

		/**
		 * The ID of the role that's in the target guild which all users must have to use the bot
		 */
		targetRole: "1155285857046114305",

		/**
		 * IDs of channels where /live can be ran in
		 */
		slashliveWhitelist: ["1153021235635179683"],
	},
};
