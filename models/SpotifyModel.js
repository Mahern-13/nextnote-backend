const knex = require("../knex/knex.js");

class SpotifyModel {
  insertAuthData(app_name, payload) {
    return knex("authentication_info").insert({
      app_name,
      auth_data: payload
    });
  }
  updateAuthData(app_name, payload) {
    return knex("authentication_info")
      .where({ app_name: app_name })
      .update({ auth_data: payload });
  }
  authDataCount(app_name) {
    return knex("authentication_info")
      .count("*")
      .where({ app_name: app_name });
  }
  getAuthData(app_name) {
    return knex
      .select("auth_data")
      .from("authentication_info")
      .where({ app_name: app_name });
  }
  insertOAuthData(id, app_name, payload) {
    return knex("authentication_info").insert({
      spotifyUserId: id,
      app_name,
      auth_data: payload,
      access_token: payload.access_token
    });
  }
  updateOAuthData(app_name, payload) {
    return knex("authentication_info")
      .where({ app_name: app_name })
      .update({ auth_data: payload });
  }
  handleCallBack(app_name) {
    return knex("authentication_info")
      .where({ app_name: app_name })
      .del();
  }
  getAccessToken(id) {
    return knex
      .select("auth_data")
      .from("authentication_info")
      .where({ spotifyUserId: id });
  }
}

module.exports = new SpotifyModel();
