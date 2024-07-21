"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const schema_1 = require("@graphql-tools/schema");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const graphql_1 = require("graphql");
const ws_1 = require("ws");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// Define the GrpahQL schema
const typeDefs = `
  type Message {
    id: ID!
    content: String!
  }

  type Query {
    messages: [Message!]
    message(id: ID!): Message
  }

  type Mutation {
    addMessage(content: String!): Message
    updateMessage(id: ID!, content: String!): Message
    deleteMessage(id: ID!): Message
  }

  type Subscription {
    messageAdded: Message
    messageUpdated: Message
    messageDeleted: Message
  }
`;
// In-memory message storage
const messages = [];
const pubsub = new graphql_subscriptions_1.PubSub();
// Define resolvers for handling GraphQL operations
const resolvers = {
    Query: {
        messages: () => messages,
        message: (parent, { id }) => messages.find(message => message.id === id),
    },
    Mutation: {
        addMessage: (parent, { content }) => {
            const message = { id: `${messages.length + 1}`, content };
            messages.push(message);
            pubsub.publish('MESSAGE_ADDED', { messageAdded: message });
            return message;
        },
        updateMessage: (parent, { id, content }) => {
            const message = messages.find(message => message.id === id);
            if (!message)
                throw new Error('Message not found');
            message.content = content;
            pubsub.publish('MESSAGE_UPDATED', { messageUpdated: message });
            return message;
        },
        deleteMessage: (parent, { id }) => {
            const index = messages.findIndex(message => message.id === id);
            if (index === -1)
                throw new Error('Message not found');
            const [message] = messages.splice(index, 1);
            pubsub.publish('MESSAGE_DELETED', { messageDeleted: message });
            return message;
        },
    },
    Subscription: {
        messageAdded: {
            subscribe: () => pubsub.asyncIterator(['MESSAGED_ADDED']),
        },
        messageUpdated: {
            subscribe: () => pubsub.asyncIterator(['MESSAGED_UPDATED']),
        },
        messageDeleted: {
            subscribe: () => pubsub.asyncIterator(['MESSAGE_DELETED']),
        },
    },
};
// Create the executable schema
const schema = (0, schema_1.makeExecutableSchema)({ typeDefs, resolvers });
const app = (0, express_1.default)(); // Create and Express application
const httpServer = (0, http_1.createServer)(app); // Create and HTTP server
const wsServer = new ws_1.WebSocketServer({
    server: httpServer,
    path: '/graphql',
});
// Create the subscription server
const subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({
    schema,
    execute: graphql_1.execute,
    subscribe: graphql_1.subscribe,
    onConnect: () => console.log('Connected to websocket'),
}, wsServer);
// Create ApolloServer instance with schema and plugins
const server = new server_1.ApolloServer({
    schema,
    plugins: [
        (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        subscriptionServer.close();
                    },
                };
            },
        },
    ],
});
// Start the server and set up middleware
server.start().then(() => {
    app.use((0, cors_1.default)()); // Enable CORS
    app.use(body_parser_1.default.json()); // Parse JSON request bodies
    app.use('/graphql', (0, express4_1.expressMiddleware)(server)); // Add Apollo middleware to Express
    httpServer.listen(4000, () => {
        console.log('Server is running on http://localhost:4000/graphql'); // Start the server
    });
});
