import { ApolloClient, InMemoryCache, ApolloProvider, split, HttpLink } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
// import getMainDefinition to identify operation types
import { getMainDefinition } from '@apollo/client/utilities';

// Create an HTTP link to connect to the GraphQL server via HTTP
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Create a Websocket link to connect to the GraphQL server via WebSocket
const wsLink = new WebSocketLink({
  uri: 'ws://localhost:4000/graphql',
  options: {
    reconnect: true, // Automatically reconnect if the connection is lost
  },
});

// Split the link avsed on operation type

const splitLink = split(
  ({ query }) => {
    // Extract the main definition from the query
    const definition  = getMainDefinition(query);
    // Check if the opration is a subscription
    return (
      definition.kind == 'OperationDefinition' &&
      definition.operation == 'subscription'
    );
  },
  wsLink, // Use WebSocket link for subscriptions
  httpLink // Use HTTP link for queries and mutations
);

// Create an Apollo Client instance
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

// Export the Apollo client and Apollo Privder for use in the React application
export { client, ApolloProvider }