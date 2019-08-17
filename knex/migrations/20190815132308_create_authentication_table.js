
exports.up = function(knex) {
    return knex.schema.createTable('authentication_info', function(table) {
        table.increments('id').unsigned().primary();
        table.string('app_name').notNull();
        table.json('auth_data').notNull();
    });

};

exports.down = function(knex) {
    return knex.schema.dropTable('authentication_info');
};
