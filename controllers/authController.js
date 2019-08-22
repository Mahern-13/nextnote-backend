var knex = require("../knex/knex.js");

const getAccessToken = id => {
  return knex
    .select("auth_data")
    .from("authentication_info")
    .where({ spotifyUserId: id });
};

module.exports = {
  getAccessToken
};
