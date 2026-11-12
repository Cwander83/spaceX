import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link, useParams } from 'react-router-dom';
import { LAUNCHES_QUERY, LAUNCH_QUERY } from '../graphql/queries.js';
import { formatTimestamps, padFlight } from '../lib/telemetry.js';
import { useSheet } from '../context/SheetContext.jsx';
import {
  IconArrowLeft,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCross,
  IconExternalLink,
} from './Icons.jsx';
import VehicleSchematic from './VehicleSchematic.jsx';

export default function Launch() {
  const { flight_number: flightNumberParam } = useParams();
  const parsedFlightNumber = Number(flightNumberParam);
  const isValidFlightNumber =
    Number.isInteger(parsedFlightNumber) && parsedFlightNumber > 0;

  const { vtFlight, navigateSheet, setLastInspectedFlight } = useSheet();

  const { loading, error, data } = useQuery(LAUNCH_QUERY, {
    variables: { flight_number: parsedFlightNumber },
    skip: !isValidFlightNumber,
  });

  const { data: listData } = useQuery(LAUNCHES_QUERY, {
    fetchPolicy: 'cache-first',
  });

  const launches = listData?.launches ?? [];
  const cachedLaunch =
    launches.find((item) => item.flight_number === parsedFlightNumber) || null;
  const launchRecord = data?.launch ?? cachedLaunch;

  const currentIdx = launches.findIndex(
    (item) => item.flight_number === parsedFlightNumber
  );
  const prevLaunch =
    currentIdx >= 0 && currentIdx < launches.length - 1
      ? launches[currentIdx + 1]
      : null;
  const nextLaunch = currentIdx > 0 ? launches[currentIdx - 1] : null;

  useEffect(() => {
    if (isValidFlightNumber) {
      setLastInspectedFlight(parsedFlightNumber);
    }
  }, [isValidFlightNumber, parsedFlightNumber, setLastInspectedFlight]);

  const returnToManifest = (e) =>
    navigateSheet(e, '/', {
      flightNumber: isValidFlightNumber ? parsedFlightNumber : null,
      focusId: 'manifest-heading',
    });

  if (!isValidFlightNumber) {
    return (
      <section className="state-panel" aria-labelledby="detail-heading">
        <h3
          id="detail-heading"
          tabIndex={-1}
          className="vt-title-target state-title"
        >
          INVALID FLIGHT IDENTIFIER
        </h3>
        <p className="state-detail">
          Flight number parameter must be a positive integer.
        </p>
        <Link to="/" className="manual-btn" onClick={returnToManifest}>
          <IconArrowLeft />
          Return to Manifest
        </Link>
      </section>
    );
  }

  if (loading && !launchRecord) {
    return (
      <section
        className="state-panel"
        role="status"
        aria-labelledby="detail-heading"
      >
        <h3
          id="detail-heading"
          tabIndex={-1}
          className="vt-title-target state-title"
        >
          LOADING FLIGHT #{padFlight(parsedFlightNumber)} DOSSIER
        </h3>
        <p className="state-detail">
          Fetching launch record and vehicle specifications from /graphql.
        </p>
      </section>
    );
  }

  if (error && !launchRecord) {
    return (
      <section
        className="state-panel"
        role="alert"
        aria-labelledby="detail-heading"
      >
        <h3
          id="detail-heading"
          tabIndex={-1}
          className="vt-title-target state-title"
        >
          DOSSIER LOAD ERROR
        </h3>
        <p className="state-detail">{error.message}</p>
        <Link to="/" className="manual-btn" onClick={returnToManifest}>
          <IconArrowLeft />
          Return to Manifest
        </Link>
      </section>
    );
  }

  if (!launchRecord) {
    return (
      <section className="state-panel" aria-labelledby="detail-heading">
        <h3
          id="detail-heading"
          tabIndex={-1}
          className="vt-title-target state-title"
        >
          FLIGHT RECORD NOT FOUND
        </h3>
        <p className="state-detail">
          No telemetry dossier exists for flight #{padFlight(parsedFlightNumber)}.
        </p>
        <Link to="/" className="manual-btn" onClick={returnToManifest}>
          <IconArrowLeft />
          Return to Manifest
        </Link>
      </section>
    );
  }

  const {
    flight_number,
    mission_name,
    launch_year,
    launch_date_local,
    launch_success,
    status_name,
    mission_description,
    orbit_name,
    orbit_abbrev,
    pad_name,
    pad_location,
    webcast_url,
    rocket,
  } = launchRecord;

  const isTransitioning = vtFlight === flight_number;
  const { utc, local } = formatTimestamps(launch_date_local);
  const orbitDisplay = orbit_name
    ? orbit_abbrev
      ? `${orbit_name} (${orbit_abbrev})`
      : orbit_name
    : 'Unclassified / TBD';

  return (
    <section id="view-detail" aria-labelledby="detail-heading">
      <div
        id="detail-shell"
        style={isTransitioning ? { viewTransitionName: 'launch-card' } : undefined}
      >
        <div className="dossier-nav">
          <Link to="/" className="manual-btn" onClick={returnToManifest}>
            <IconArrowLeft />
            Return to Manifest
          </Link>

          <div className="filter-group">
            {prevLaunch ? (
              <Link
                to={`/launch/${prevLaunch.flight_number}`}
                className="manual-btn"
                onClick={(e) =>
                  navigateSheet(e, `/launch/${prevLaunch.flight_number}`, {
                    flightNumber: prevLaunch.flight_number,
                    focusId: 'detail-heading',
                  })
                }
              >
                <IconChevronLeft />
                Prev Flight
              </Link>
            ) : (
              <button type="button" className="manual-btn" disabled>
                <IconChevronLeft />
                Prev Flight
              </button>
            )}

            {nextLaunch ? (
              <Link
                to={`/launch/${nextLaunch.flight_number}`}
                className="manual-btn"
                onClick={(e) =>
                  navigateSheet(e, `/launch/${nextLaunch.flight_number}`, {
                    flightNumber: nextLaunch.flight_number,
                    focusId: 'detail-heading',
                  })
                }
              >
                Next Flight
                <IconChevronRight />
              </Link>
            ) : (
              <button type="button" className="manual-btn" disabled>
                Next Flight
                <IconChevronRight />
              </button>
            )}
          </div>
        </div>

        <div className="dossier-split">
          <div className="dossier-specs-col">
            <div className="dossier-header-block">
              <div className="dossier-meta-row">
                <span className="flight-chip">
                  FLIGHT {padFlight(flight_number)}
                </span>
                <span
                  className="stamp-badge"
                  data-status={launch_success ? 'nominal' : 'anomaly'}
                >
                  {launch_success ? <IconCheck /> : <IconCross />}
                  <span>{launch_success ? 'NOMINAL' : 'ANOMALY'}</span>
                </span>
              </div>

              <h3
                id="detail-heading"
                tabIndex={-1}
                className="vt-title-target dossier-heading"
                style={
                  isTransitioning ? { viewTransitionName: 'launch-title' } : undefined
                }
              >
                Mission: {mission_name}
              </h3>

              <p className="hero-copy" style={{ marginTop: 0 }}>
                Engineering specification sheet populated from the GraphQL
                Launch and Rocket queries.
              </p>
            </div>

            <div className="spec-grid-wrap">
              <div className="spec-section-bar">
                Section A // Launch Telemetry Record
              </div>
              <dl className="spec-grid-2">
                <div className="spec-cell">
                  <dt className="spec-dt">Flight Number</dt>
                  <dd className="spec-dd">{flight_number}</dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Launch Year</dt>
                  <dd className="spec-dd">{launch_year || 'Unknown'}</dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Mission Outcome</dt>
                  <dd className="spec-dd">
                    {launch_success ? 'Nominal (True)' : 'Anomaly (False)'}
                  </dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Launch Timestamp</dt>
                  <dd className="spec-dd" style={{ fontSize: '13px', lineHeight: 1.55 }}>
                    <time dateTime={launch_date_local || undefined}>
                      {utc}
                      <br />
                      <span style={{ color: 'var(--ink-muted)' }}>
                        Local: {local}
                      </span>
                    </time>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="spec-grid-wrap">
              <div className="spec-section-bar">
                Section B // Launch Vehicle Hardware
              </div>
              <dl className="spec-grid-3">
                <div className="spec-cell">
                  <dt className="spec-dt">Rocket ID</dt>
                  <dd className="spec-dd">{rocket?.rocket_id ?? 'Unknown'}</dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Vehicle Designation</dt>
                  <dd className="spec-dd spec-dd-sans">
                    {rocket?.rocket_name ?? 'Unknown'}
                  </dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Configuration / Block</dt>
                  <dd className="spec-dd">{rocket?.rocket_type ?? 'Unknown'}</dd>
                </div>
              </dl>
            </div>

            <div className="spec-grid-wrap-last">
              <div className="spec-section-bar">
                Section C // Pad &amp; Orbital Parameters
              </div>
              <dl className="spec-grid-2">
                <div className="spec-cell">
                  <dt className="spec-dt">Launch Complex</dt>
                  <dd className="spec-dd spec-dd-sans">
                    {pad_name || 'Unassigned Pad'}
                    {pad_location ? (
                      <>
                        <br />
                        <span className="spec-dd-sub">{pad_location}</span>
                      </>
                    ) : null}
                  </dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Target Orbit</dt>
                  <dd className="spec-dd spec-dd-sans">{orbitDisplay}</dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Telemetry Status</dt>
                  <dd className="spec-dd">
                    {status_name ||
                      (launch_success ? 'Launch Successful' : 'Launch Anomaly')}
                  </dd>
                </div>
                <div className="spec-cell">
                  <dt className="spec-dt">Webcast Archive</dt>
                  <dd className="spec-dd">
                    {webcast_url ? (
                      <a
                        href={webcast_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="manual-btn webcast-btn"
                      >
                        <span>Open Flight Webcast</span>
                        <IconExternalLink />
                      </a>
                    ) : loading ? (
                      <span className="spec-dd-sub">Checking Archive...</span>
                    ) : (
                      <span className="spec-dd-sub">No Archived Stream</span>
                    )}
                  </dd>
                </div>
              </dl>

              {mission_description ? (
                <div className="dossier-brief-box">
                  <div className="spec-dt">Mission Brief</div>
                  <p className="dossier-brief-copy">{mission_description}</p>
                </div>
              ) : null}
            </div>
          </div>

          <VehicleSchematic
            rocketName={rocket?.rocket_name}
            rocketType={rocket?.rocket_type}
            launchSuccess={launch_success}
          />
        </div>
      </div>
    </section>
  );
}
