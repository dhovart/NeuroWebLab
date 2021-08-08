const monk = require('monk');
let db;
let connected = false;

const mongoDB = () => db;

const version = () => {
  console.log("db v0.0.1");
};

/** @todo Fix https://github.com/neuroanatomy/NeuroWebLab/issues/1 */
let usernameField;
let usersCollection;
let projectsCollection;

/**
 * @returns {boolean} checks mongodb connection
 */
const checkHealth = () => connected;

/** @todo Fix https://github.com/neuroanatomy/NeuroWebLab/issues/1 */
/** add user
 * @param {object} user User to add
 * @returns {object} The user that was added
*/
const addUser = (user) => new Promise((resolve, reject) => {
  if (!checkHealth()) {
    return reject(new Error('db connection not healthy'));
  }
  db.get(usersCollection).insert(user)
    .then(() => resolve(user))
    .catch((e) => reject(e));
});

/** @todo Fix https://github.com/neuroanatomy/NeuroWebLab/issues/1 */

const updateUser = (user) => new Promise((resolve, reject) => {
  if (!checkHealth()) {
    return reject(new Error('db connection not healthy'));
  }

  // const query = {username: user.username}
  const query = {};
  query[usernameField] = user.username || user[usernameField];

  delete user._id;

  db.get(usersCollection).update(query, {
    $set: user
  })
    .then(() => resolve(user))
    .catch(reject);
});

/** find user */
const queryUser = (searchQuery) => new Promise((resolve, reject) => {
  if (!checkHealth()) {
    return reject(new Error('db connection not healthy'));
  }

  db.get(usersCollection).findOne(searchQuery)
    .then((user) => {
      if(user) {
        resolve(user);
      } else {
        reject({
          message: 'error find one user',
          result: user
        });
      }
    })
    .catch(reject);
});

/** @todo Fix https://github.com/neuroanatomy/NeuroWebLab/issues/1 */
/** upsert user */
const upsertUser = (user) => new Promise((resolve, reject) => {
  if (!checkHealth()) {
    return reject(new Error('db connection not healthy'));
  }

  // const query = {username: user.username}
  const query = {};
  query[usernameField] = user.username || user[usernameField];

  delete user._id;

  queryUser(query)
    .then(() => updateUser(user))
    .then(resolve)
    .catch((e) => {
      if(e.message === 'error find one user') {
        addUser(user)
          .then(resolve)
          .catch(reject);
      } else {
        reject(e);
      }
    });
});

/** add token
 * @param {string} token A random token to add
 * @returns {void}
*/
const addToken = (token) => new Promise((resolve, reject) => {
  db.get('log').insert(token)
    .then(() => resolve(token))
    .catch((e) => reject(e));
});

/** find token
 * @param {string} token A random token to find
 * @returns {object} DB entry for that token, with creation and expiry date
*/
const findToken = (token) => new Promise((resolve, reject) => {
  db.get('log').findOne({token})
    .then((theToken) => resolve(theToken))
    .catch((e) => reject(e));
});

/** @todo Fix https://github.com/neuroanatomy/NeuroWebLab/issues/1 */

const init = ({
  MONGO_DB,
  overwriteMongoPath,
  callback,
  usernameField: newUsernameField,
  usersCollection: newUsersCollection,
  projectsCollection: newProjectsCollection
}) => {

  /* variables used for compatibility */
  usernameField = newUsernameField;
  usersCollection = newUsersCollection;
  projectsCollection = newProjectsCollection;

  console.log(`connecting to mongodb at: ${overwriteMongoPath || MONGO_DB}`);
  db = monk(overwriteMongoPath || MONGO_DB);

  db.then(() => {
    connected = true;

    console.log('connected successfully');

    if(typeof callback !== 'undefined') {
      return callback();
    }
  })
    .catch((e) => {
      // retry (?)
      connected = false;
      console.log('connection error', e);
    });
};

module.exports = {
  version,
  init,
  addUser,
  queryUser,
  updateUser,
  upsertUser,
  mongoDB,
  checkHealth,
  addToken,
  findToken
};
