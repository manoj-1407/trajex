/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('users', {
    must_change_password: { type: 'boolean', default: false, notNull: true }
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['must_change_password']);
};
