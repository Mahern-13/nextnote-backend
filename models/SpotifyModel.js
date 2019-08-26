var knex = require("../knex/knex.js");

class SpotifyModel {
  insertAuthData(app_name, payload) {
    return knex("authentication_info").insert({
      app_name,
      auth_data: payload
    });
  }
}

module.exports = new SpotifyModel();
