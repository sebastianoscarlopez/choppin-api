const graphql = require("graphql")
const sqlite3 = require("sqlite3").verbose()

//create a database if no exists
const database = new sqlite3.Database("../choppin.db")

//create a tables
const createTables = () => {
  let query = `
    CREATE TABLE IF NOT EXISTS requests (
        id integer PRIMARY KEY,
        id_song text,
        requested text,
        played text,
        enable integer
      )`
  database.run(query)

  query = `DROP TABLE songs`
      database.run(query)

    query = `
      CREATE TABLE IF NOT EXISTS songs (
        id text,
        title text,
        description text,
        added text,
        enable integer
      )`
  return database.run(query)
}

//call function to init tables
createTables()

//creacte graphql request object
const RequestType = new graphql.GraphQLObjectType({
  name: "Request",
  fields: {
    id: { type: graphql.GraphQLID },
    id_song: { type: graphql.GraphQLString },
    requested: { type: graphql.GraphQLString },
    played: { type: graphql.GraphQLString },
    enable: { type: graphql.GraphQLBoolean }
  }
})
//creacte graphql song object
const SongType = new graphql.GraphQLObjectType({
  name: "Song",
  fields: {
    id: { type: graphql.GraphQLString },
    title: { type: graphql.GraphQLString },
    description: { type: graphql.GraphQLString },
    added: { type: graphql.GraphQLString },
    enable: { type: graphql.GraphQLBoolean }
  }
})
// create a graphql query to select all and by id
var queryType = new graphql.GraphQLObjectType({
  name: "Query",
  fields: {
    //first query to select all pending
    RequestPending: {
      type: graphql.GraphQLList(RequestType),
      resolve: (root, args, context, info) => {
        return new Promise((resolve, reject) => {
          // raw SQLite query to select from table
          database.all("SELECT * FROM requests", function(err, rows) {
            if (err) {
              reject([])
            }
            resolve(rows)
          })
        })
      }
    },
    // query to song by id
    Song: {
      type: SongType,
      args: {
        id: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        }
      },
      resolve: (root, { id }, context, info) => {
        return new Promise((resolve, reject) => {
          database.all("SELECT * FROM songs WHERE id = (?)", [id], function(
            err,
            rows
          ) {
            if (err) {
              reject(null)
            }
            resolve(rows[0])
          })
        })
      }
    }
  }
})
//mutation type is a type of object to modify data (INSERT,DELETE,UPDATE)
var mutationType = new graphql.GraphQLObjectType({
  name: "Mutation",
  fields: {
    //mutation for creacte
    createSong: {
      //type of object to return after create in SQLite
      type: SongType,
      //argument of mutation creactePost to get from request
      args: {
        id: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        },
        title: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        },
        description: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        },
        added: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        },
        enable: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLBoolean)
        }
      },
      resolve: (root, { id, title, description, added, enable }) => {
        return new Promise((resolve, reject) => {
          //raw SQLite to insert a new post in post table
          database.run(
            "INSERT INTO songs (id, title, description, added, enable) VALUES (?,?,?,?,?)",
            [id, title, description, added, enable],
            err => {
              if (err) {
                reject(null)
              }
              resolve({
                id: id,
                title: title,
                description: description,
                added: added,
                enable: enable
              })
            }
          )
        })
      }
    }
  }
})

//define schema with post object, queries, and mustation
const schema = new graphql.GraphQLSchema({
  query: queryType,
  mutation: mutationType
})

//export schema to use on index.js
module.exports = {
  schema
}
