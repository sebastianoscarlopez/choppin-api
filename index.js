const  express  =  require('express')
const ExpressGraphQL = require("express-graphql")
const { schema } = require("./graphql/_songs.js")
const cors = require('cors')

const  app  =  express()
app.use(cors())

app.use("/graphql", ExpressGraphQL({ schema, graphiql: true}))

app.listen(4000, () => {
    console.log("GraphQL server running at http://localhost:4000.")
})