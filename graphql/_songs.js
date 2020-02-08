const graphql = require("graphql")
const sqlite3 = require("sqlite3").verbose()

//create a database if no exists
const database = new sqlite3.Database("../choppin.db")

//create a tables
const createTables = () => {
  let query = `DROP TABLE IF EXISTS songs`
  database.run(query)

  query = `
      CREATE TABLE IF NOT EXISTS songs (
        id text primary key,
        title text,
        description text,
        added datetime,
        lastRequested datetime,
        isPending booblean,
        totalRequest int,
        enable booblean
      )`
  return database.run(query)
}

//call function to init tables
createTables()

//creacte graphql song object
const SongType = new graphql.GraphQLObjectType({
  name: "Song",
  fields: {
    id: { type: graphql.GraphQLString },
    title: { type: graphql.GraphQLString },
    description: { type: graphql.GraphQLString },
    added: { type: graphql.GraphQLString },
    lastRequested: { type: graphql.GraphQLString },
    isPending: { type: graphql.GraphQLBoolean },
    totalRequest: { type: graphql.GraphQLInt },
    enable: { type: graphql.GraphQLBoolean }
  }
})

var queryType = new graphql.GraphQLObjectType({
  name: "Query",
  fields: {
    Songs: {
      type: graphql.GraphQLList(SongType),
      resolve: (root, args, context, info) => {
        return new Promise((resolve, reject) => {
          database.all("SELECT * FROM songs", function(err, rows) {
            if (err) {
              reject([])
            }
            resolve(rows)
          })
        })
      }
    },
    Pending: {
      type: graphql.GraphQLList(SongType),
      resolve: (root, args, context, info) => {
        return new Promise((resolve, reject) => {
          database.all("SELECT * FROM songs where isPending = true", function(
            err,
            rows
          ) {
            if (err) {
              reject([])
            }
            resolve(rows)
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
    playedSong: {
      type: SongType,
      args: {
        id: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        }
      },
      resolve: (root, { id }) => {
        return new Promise((resolve, reject) => {
          database.run(
            "UPDATE songs SET isPending=? WHERE id = ?",
            [false, id],
            err => {
              if (err) {
                reject(null)
              }
              resolve({
                id
              })
            }
          )
        })
      }
    },
    requestSong: {
      type: SongType,
      args: {
        id: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        },
        title: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLString)
        }
      },
      resolve: (root, { id, title }) => {
        return new Promise((resolve, reject) => {
          const now = new Date().toISOString()
          database.all("SELECT * FROM songs where id = ?", [id], function(
            err,
            rows
          ) {
            console.log(err)
            if (err) {
              reject([])
            }
            // song does not exist? then insert, else totalRequest++, isPending = true
            if (rows.length === 0) {
              database.run(
                "INSERT INTO songs (id, title, added, lastRequested, totalRequest, isPending, enable) VALUES (?,?,?,?,?,?,?)",
                [id, title, now, now, 1, true, true],
                err => {
                  if (err) {
                    reject(null)
                  }
                  resolve({
                    id: id,
                    title: title,
                    totalRequest: 1
                  })
                }
              )
            } else {
              const totalRequest = rows[0].totalRequest + 1
              database.run(
                "UPDATE songs SET lastRequested=?, totalRequest=?, isPending=? WHERE id = ?",
                [now, totalRequest, true, id],
                err => {
                  if (err) {
                    reject(null)
                  }
                  resolve({
                    id: id,
                    title: title,
                    totalRequest: totalRequest
                  })
                }
              )
            }
          })
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
