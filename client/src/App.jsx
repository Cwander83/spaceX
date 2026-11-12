import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SheetProvider } from './context/SheetContext.jsx';
import SheetLayout from './components/SheetLayout.jsx';
import Launches from './components/Launches.jsx';
import Launch from './components/Launch.jsx';
import UpcomingLaunches from './components/UpcomingLaunches.jsx';

const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache({
    typePolicies: {
      Launch: { keyFields: ['flight_number'] },
      UpcomingLaunch: { keyFields: ['launch_id'] },
      Rocket: { keyFields: false },
      Query: {
        fields: {
          launch: {
            read(existing, { args, toReference }) {
              return (
                existing ??
                toReference({
                  __typename: 'Launch',
                  flight_number: args?.flight_number,
                })
              );
            },
          },
        },
      },
    },
  }),
});

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <SheetProvider>
          <Routes>
            <Route element={<SheetLayout />}>
              <Route path="/" element={<Launches />} />
              <Route path="/upcoming" element={<UpcomingLaunches />} />
              <Route path="/launch/:flight_number" element={<Launch />} />
              <Route path="*" element={<Launch />} />
            </Route>
          </Routes>
        </SheetProvider>
      </BrowserRouter>
    </ApolloProvider>
  );
}
