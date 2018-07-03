	const app = require('express')(),
		  server = require('http').createServer(app),
		  MongoClient = require('mongodb').MongoClient,
		  config = require('./config');

	server.listen(8080);

	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
		next();
	});

	app.get('/', (req, res) => {
		res.send('API for explorer.golos.io');
	});
	
	let getAccounts;

	MongoClient.connect(config.mongoUrlConnect, { useNewUrlParser: true }, (err, client) => {
		if ( ! err) {
			const db = client.db('Golos');
			const account_object = db.collection('account_object');
			
			getAccounts = (skip, limit, sort, callback) => {
				account_object
					.find({})
					.skip(parseInt(skip))
					.limit(parseInt(limit))
					.sort(sort)
					.toArray(/* (err, accounts) => {
						return accounts;
					} */)
					.then(accounts => accounts.map(account => {
						let profile_image = null;
						try {
							let jsonMetadata = JSON.parse(account.json_metadata);
							if (jsonMetadata.profile && jsonMetadata.profile.profile_image) profile_image = jsonMetadata.profile.profile_image;
						}
						catch (e) {
							//console.error(e);
						}
						return { name: account.name, post_count: account.post_count, vesting_shares_value: account.vesting_shares_value, balance_value: account.balance_value, sbd_balance_value: account.sbd_balance_value, profile_image: profile_image }
					}))
					.then(accounts => {
						account_object.countDocuments()
							.then(count => {
								callback({ lastRow: count, rows: accounts });
							});
					});
			}
			//client.close();
			
		}
		else console.error(err);
		
	});
	
	app.get('/getAccounts', (req, res) => {
		if ( ! req.query.startRow) req.query.startRow = 0;
		if ( ! req.query.endRow) req.query.endRow = 100;
		if (req.query.sortModel) {
			let sort = {};
			req.query.sortModel.forEach((row) => {
				sort[row.colId] = (row.sort == 'asc' ? 1 : -1);
			});
			req.query.sortModel = sort;
		}
		else req.query.sortModel = {};
		getAccounts(req.query.startRow, req.query.endRow, req.query.sortModel, (accounts) => {
			res.send(accounts);
		});
	});
