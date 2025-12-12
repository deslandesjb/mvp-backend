const request = require('supertest');
const app = require('../app');
const List = require('../models/lists');

jest.mock('../models/lists');

describe("GET /lists/:idUser", () => {

  test("Renvoie les listes de l'utilisateur", async () => {

    const fakeLists = [
      {
        _id: "list1",
        name: "Liste 1",
        idUser: "user123",
        idProduct: []
      }
    ];

    List.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(fakeLists)
    });

    const res = await request(app).get("/lists/user123");

    expect(res.body.result).toBe(true);
    expect(res.body.listsUser.length).toBe(1);
    expect(res.body.listsUser[0].name).toBe("Liste 1");
  });


  test("Erreur serveur", async () => {

    List.find.mockReturnValue({
      populate: jest.fn().mockRejectedValue(new Error("fail"))
    });

    const res = await request(app).get("/lists/user123");

    expect(res.status).toBe(500);
    expect(res.body.result).toBe(false);
  });

});
