const request = require('supertest');
const app = require('./app');

it('GET all products', async () => {
	const res = await request(app).get('/products');

	expect(res.statusCode).toBe(200);
	expect(res.body.result).toEqual(true);
	expect(res.body.products.length).toBe(105);
});

it('GET all categories', async () => {
	const res = await request(app).get('/products/categories');

	expect(res.statusCode).toBe(200);
	expect(res.body.result).toEqual(true);
	expect(res.body.categories.length).toBe(5);
});

it('GET all product info by id', async () => {
	const res = await request(app).get('/products/id/69383ba502d195cb6577d4db');

	expect(res.statusCode).toBe(200);
	expect(res.body.result).toEqual(true);
	expect(res.body.products.name).toBe('Casque audio sans fil SONY Bluetooth à réduction de bruit WH-CH720N Noir');
});
