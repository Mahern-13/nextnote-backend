const knex = require('knex')({
    client: 'postgresql',
    connection: {
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        port: process.env.DATABASE_PORT
    },
    migrations: {
        directory: __dirname + "/knex/migrations"
    },
    seeds: {
        directory: __dirname + "/knex/seeds"
    }
  });
  
module.exports = knex

//   try {
//     // Create a table
//     await knex.schema
//       .createTable('authentication_info', (table) => {
//         table.increments('id').unsigned().primary()
//         table.string("app_name").notNull();
//         table.json("auth_data").notNull();
//         table.string("spotifyUserId").notNull();
//         table.string("access_token").notNull();
//       })
//     } catch (error) {
//         console.error(error)
//     }