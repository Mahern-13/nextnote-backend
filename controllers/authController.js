var knex = require("../knex/knex.js");

const getAccessToken = id => {
  console.log("in get access token", id);
  return knex
    .select("auth_data")
    .from("authentication_info")
    .where({ spotifyUserId: id });
};

module.exports = {
  getAccessToken
};
