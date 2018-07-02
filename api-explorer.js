	const app = require('express')(),
		  server = require('http').createServer(app);

	server.listen(8080);

	app.get('/', (req, res) => {
		res.send('In progress...');
	});