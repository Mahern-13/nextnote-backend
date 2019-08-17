# artist-backend

create a pg db and then add the folowing references to the .env file

```.env
SPOTIFY_CLIENT_ID=?
SPOTIFY_CLIENT_SECRET=?
SPOTIFY_REDIRECT_URI='http://localhost:3000/spotify/callback'
DATABASE_NAME=?
DATABASE_USER=?
DATABASE_PASSWORD=?
```

next hit the 'localhost:3000/spotify/login' endpoint => that will authorize the user to access the app.
