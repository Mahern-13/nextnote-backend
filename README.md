# artist-backend

## Steps to run locally

### DB and .env

create a pg db and then add the folowing references to the .env file

(signup for spotify api key => https://developer.spotify.com/dashboard/)
(signup for ticketmaster api key => https://developer.ticketmaster.com/)

```.env
SPOTIFY_CLIENT_ID=?
SPOTIFY_CLIENT_SECRET=?
SPOTIFY_REDIRECT_URI='http://localhost:3000/spotify/callback'
TICKETMASTER_API_KEY=?
DATABASE_NAME=?
DATABASE_USER=?
DATABASE_PASSWORD=?
```

### Launching backend

`npm install`
`knex migrate:latest`
`npm start`
