import { gql } from '@apollo/client';

export const LAUNCHES_QUERY = gql`
  query LaunchesQuery {
    launches {
      flight_number
      mission_name
      launch_year
      launch_date_local
      launch_success
      status_name
      status_abbrev
      mission_description
      orbit_name
      orbit_abbrev
      pad_name
      pad_location
      webcast_live
      rocket {
        rocket_id
        rocket_name
        rocket_type
      }
    }
  }
`;

export const LAUNCH_QUERY = gql`
  query LaunchQuery($flight_number: Int!) {
    launch(flight_number: $flight_number) {
      flight_number
      mission_name
      launch_year
      launch_date_local
      launch_success
      status_name
      status_abbrev
      mission_description
      orbit_name
      orbit_abbrev
      pad_name
      pad_location
      webcast_url
      webcast_live
      rocket {
        rocket_id
        rocket_name
        rocket_type
      }
    }
  }
`;

export const UPCOMING_LAUNCHES_QUERY = gql`
  query UpcomingLaunchesQuery {
    upcomingLaunches {
      launch_id
      flight_number
      mission_name
      launch_year
      net
      status_name
      status_abbrev
      mission_description
      orbit_name
      orbit_abbrev
      pad_name
      pad_location
      webcast_url
      webcast_live
      rocket {
        rocket_id
        rocket_name
        rocket_type
      }
    }
  }
`;
