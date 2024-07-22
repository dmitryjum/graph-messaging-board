import React from 'react';
import { ApolloProvider, client } from './apolloClient';
import Messages from './Messages';

const App: React.FC = () => (
  // Wrap the application with ApolloPrivder and pass the Apollo Client instance
  <ApolloProvider client={client}>
    <div className='app-wrapper'>
      <h1>Real-Time Message Board</h1>
      <h2>GraphQL Subscriptions with React</h2>
      <Messages /> {/* Render the Messages component */}
    </div>
  </ApolloProvider>
);

export default App
