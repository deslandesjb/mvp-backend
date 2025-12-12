var express = require('express');
var router = express.Router();

router.post('/', (req, res) => {
	let table = [];
	fetch(`https://raw.githubusercontent.com/deslandesjb/mvp-backend/refs/heads/main/bdd/amazon.json`)
		.then((response) => response.json())
		.then((data) => {
			for (let d of data) {
				console.log(d.name);
				table.push(data.name);
			}
		});

	res.status(200).json({result: true, table: table});
	// fetch(`https://raw.githubusercontent.com/Azeddine-EA/mvpApi/main/mvpApi.json`)
	// 	.then((response) => response.json())
	// 	.then((data) => {
	// 		console.log(data);
	// 		const {name} = req.body;
	// 		if (!name) {
	// 			res.status(406).json({result: false, error: 'One or many of the fields are missing'});
	// 			return;
	// 		}

	// 		// User.find({name}).then((data) => {
	// 		// 	if (data) {
	// 		// 		res.status(200).json({result: true, data: data});
	// 		// 	}
	// 		// });
	// 	});
});

module.exports = router;
