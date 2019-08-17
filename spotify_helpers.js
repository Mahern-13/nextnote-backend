var {
  spotifyClientId,
  spotifyClientSecret,
  spotifyRedirectUri
} = require("./config");
var knex = require("./knex/knex.js");
var axios = require("axios");
var qs = require("querystring");

function setSpotifyToken() {
  var url = "https://accounts.spotify.com/api/token";
  var credentials = spotifyClientId + ":" + spotifyClientSecret;
  credentials = Buffer.from(credentials).toString("base64");
  var authData = null;
  return axios
    .post(url, qs.stringify({ grant_type: "client_credentials" }), {
      headers: {
        Authorization: "Basic " + credentials,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    .then(response => {
      authData = response.data;
      var currentTime = new Date();
      currentTime = (
        currentTime.getTime() +
        authData.expires_in * 1000
      ).toString();
      authData.expiresAt = currentTime;
      return knex("authentication_info")
        .count("*")
        .where({ app_name: "spotify" });
    })
    .then(total => {
      total = parseInt(total[0].count);
      if (total == 0) {
        return knex("authentication_info").insert({
          app_name: "spotify",
          auth_data: authData
        });
      } else {
        return knex("authentication_info")
          .where({ app_name: "spotify" })
          .update({ auth_data: authData });
      }
    })
    .then(() => {
      return authData;
    })
    .catch(error => {
      console.log(error);
    });
}

function getSpotifyToken() {
  return knex
    .select("auth_data")
    .from("authentication_info")
    .where({ app_name: "spotify" })
    .then(rows => {
      if (rows.length == 0) {
        return setSpotifyToken();
      } else {
        var expiryTime = new Date(parseInt(rows[0].auth_data.expiresAt));
        var currentTime = new Date();
        if (!expiryTime || expiryTime <= currentTime) {
          return setSpotifyToken();
        }
        return rows[0].auth_data;
      }
    })
    .then(response => {
      return response;
    });
}

function getSpotifyTokenFromOAuth(authCode) {
  var url = "https://accounts.spotify.com/api/token";
  var params = {
    grant_type: "authorization_code",
    code: authCode,
    redirect_uri: spotifyRedirectUri
  };
  var credentials = spotifyClientId + ":" + spotifyClientSecret;
  credentials = Buffer.from(credentials).toString("base64");
  return axios
    .post(url, qs.stringify(params), {
      headers: {
        Authorization: "Basic " + credentials,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    .then(response => {
      authData = response.data;
      var currentTime = new Date();
      currentTime = (
        currentTime.getTime() +
        authData.expires_in * 1000
      ).toString();
      authData.expiresAt = currentTime;
      return knex("authentication_info").insert({
        app_name: "spotify-oauth",
        auth_data: authData
      });
    })
    .then(response => {
      return authData;
    })
    .catch(err => console.log(err));
}

function getSpotifyAuthorizeUrl() {
  var url =
    "https://accounts.spotify.com/authorize?response_type=code&client_id=" +
    spotifyClientId +
    "&redirect_uri=" +
    encodeURIComponent(spotifyRedirectUri);
  return url;
}

function handleSpotifyCallback(authCode) {
  return knex("authentication_info")
    .where({ app_name: "spotify-oauth" })
    .del()
    .then(() => {
      return getSpotifyTokenFromOAuth(authCode);
    });
}

function refreshSpotifyToken(authData) {
  var refreshToken = authData.refresh_token;
  var url = "https://accounts.spotify.com/api/token";
  var params = {
    grant_type: "refresh_token",
    refresh_token: refreshToken
  };
  var credentials = spotifyClientId + ":" + spotifyClientSecret;
  credentials = Buffer.from(credentials).toString("base64");

  var authData = null;
  return axios
    .post(url, qs.stringify(params), {
      headers: {
        Authorization: "Basic " + credentials,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    .then(response => {
      var currentTime = new Date();
      currentTime = (
        currentTime.getTime() +
        authData.expires_in * 1000
      ).toString();
      authData.expiresAt = currentTime;
      authData.access_token = response.data.access_token;
      return knex("authentication_info")
        .where({ app_name: "spotify-oauth" })
        .update({ auth_data: authData });
    })
    .then(() => {
      return authData;
    })
    .catch(err => {
      console.log(err);
      return "refreshFailed";
    });
}

function getSpotifyOAuthToken() {
  return knex
    .select("auth_data")
    .from("authentication_info")
    .where({ app_name: "spotify-oauth" })
    .then(rows => {
      var expiryTime = new Date(parseInt(rows[0].auth_data.expiresAt));
      var currentTime = new Date();
      if (!expiryTime || expiryTime <= currentTime) {
        return refreshSpotifyToken(rows[0]);
      }
      return rows[0].auth_data;
    })
    .then(response => {
      return response;
    });
}

function getSpotifyArtist(id, authData) {
  url = `https://api.spotify.com/v1/artists/${id}`;
  return axios
    .get(url, {
      headers: {
        Authorization: "Bearer " + authData.access_token
      }
    })
    .then(response => response.data)
    .catch(err => console.log(err));
}

function getSpotifyTopTen(id, authData) {
  url = `https://api.spotify.com/v1/artists/${id}/top-tracks?country=from_token`;
  return axios
    .get(url, {
      headers: {
        Authorization: "Bearer " + authData.access_token
      }
    })
    .then(response => response.data)
    .catch(err => console.log(err));
}

function getSpotifyRelatedArtists(id, authData) {
  url = `https://api.spotify.com/v1/artists/${id}/related-artists`;
  return axios
    .get(url, {
      headers: {
        Authorization: "Bearer " + authData.access_token
      }
    })
    .then(response => response.data)
    .catch(err => console.log(err));
}

module.exports = {
  setSpotifyToken,
  getSpotifyToken,
  handleSpotifyCallback,
  getSpotifyOAuthToken,
  getSpotifyAuthorizeUrl,
  getSpotifyArtist,
  getSpotifyTopTen,
  getSpotifyRelatedArtists
};
