import React, { Component } from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Launches from "./compoments/Launches";
import Launch from "./compoments/Launch";
import "./App.css";

const client = new ApolloClient({
  uri: "/graphql"
});

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <Router>
          <div className="container">
            <h1>SpaceX</h1>
          </div>
          <Route exact strict path="/" component={Launches} />
          <Route
            exact
            strict
            path="/launch/:flight_number"
            component={Launch}
          />
        </Router>
      </ApolloProvider>
    );
  }
}

export default App;
