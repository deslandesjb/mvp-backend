const request = require('supertest');
const app = require('./app'); 

it('POST /signup - crée un utilisateur avec succès', async () => {
  const res = await request(app).post('/users/signup').send({
    firstname: 'Johanson',
    lastname: 'Nzoda',
    mail: 'signup@test.com',
    password: '123456'
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.newUser).toBeDefined();
  expect(res.body.newUser.mail).toBe('signup@test.com');
});

it('POST /signup - renvoie une erreur si l’utilisateur existe déjà', async () => {
  const res = await request(app).post('/users/signup').send({
    firstname: 'Johanson',
    lastname: 'Nzoda',
    mail: 'signup@test.com',
    password: '123456'
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(false);
  expect(res.body.error).toBe('User already exists');
});
