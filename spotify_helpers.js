var {
  spotifyClientId,
  spotifyClientSecret,
  spotifyRedirectUri
} = require("./config");
var knex = require("./knex/knex.js");
var axios = require("axios");
var qs = require("querystring");
const SpotifyModel = require("./models/SpotifyModel");
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
        return SpotifyModel.insertAuthData("spotify", authData);
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
      const { access_token } = response.data;
      var currentTime = new Date();
      currentTime = (
        currentTime.getTime() +
        authData.expires_in * 1000
      ).toString();
      authData.expiresAt = currentTime;

      return axios
        .get("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/x-www-form-urlencoded"
          }
        })
        .then(response => ({ id: response.data.id, authData }));
    })
    .then(async ({ id, authData }) => {
      await knex("authentication_info").insert({
        spotifyUserId: id,
        app_name: "spotify-oauth",
        auth_data: authData,
        access_token: authData.access_token
      });
      return id;
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

/**
 * Client sends an api call to check if a user is authenticated
 * if yes then gets a token
 * otherwise was not authenticated so display login page
 * Login page on the client side
 * User clicks login button
 * User is redirected to /spotify/login
 * User logs in with spotify and is redirected to callback route
 * User is redirected back to the website
 * Client sends an api call to check if a user is authenticated
 * if yes then gets a token
 * otherwise was not authenticated so display login page
 */

function getSpotifyOAuthToken(id) {
  return knex
    .select("auth_data")
    .from("authentication_info")
    .where({ spotifyUserId: id })
    .then(rows => {
      var expiryTime = new Date(parseInt(rows[0].auth_data.expiresAt));
      var currentTime = new Date();
      if (!expiryTime || expiryTime <= currentTime) {
        // TODO: Check if refreshing a token works
        return refreshSpotifyToken(rows[0]);
      }
      return rows[0].auth_data;
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
