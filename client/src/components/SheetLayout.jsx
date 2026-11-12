import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link, Outlet, useMatch } from 'react-router-dom';
import { LAUNCHES_QUERY } from '../graphql/queries.js';
import {
  computeManifestStats,
  formatElapsedSince,
  getTrajectoryProfile,
  padFlight,
} from '../lib/telemetry.js';
import { useSheet } from '../context/SheetContext.jsx';
import { RegCrosshair } from './Icons.jsx';
import PlotterCanvas from './PlotterCanvas.jsx';

export default function SheetLayout() {
  const { data } = useQuery(LAUNCHES_QUERY);
  const launches = data?.launches ?? [];
  const stats = computeManifestStats(launches);

  const detailMatch = useMatch('/launch/:flight_number');
  const routeFlight = detailMatch ? Number(detailMatch.params.flight_number) : null;
  const isDetailRoute = Boolean(detailMatch);

  const {
    motionPaused,
    toggleMotion,
    hoveredFlight,
    lastInspectedFlight,
    navigateSheet,
  } = useSheet();

  const dossierTargetFlight =
    (Number.isInteger(routeFlight) ? routeFlight : null) ??
    lastInspectedFlight ??
    stats.latestFlight ??
    745;

  const activeFlightNum =
    (Number.isInteger(routeFlight) ? routeFlight : null) ??
    hoveredFlight ??
    stats.latestFlight;

  const trackedLaunch =
    launches.find((item) => item.flight_number === activeFlightNum) ||
    launches[0] ||
    null;

  const profile = getTrajectoryProfile(trackedLaunch);

  const [elapsedText, setElapsedText] = useState(() =>
    formatElapsedSince(stats.latestIso)
  );

  useEffect(() => {
    setElapsedText(formatElapsedSince(stats.latestIso));
    if (!stats.latestIso) return undefined;
    const timer = setInterval(() => {
      setElapsedText(formatElapsedSince(stats.latestIso));
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.latestIso]);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="top-bar-brand">
            <span className="brand-mark">SPX // 68</span>
            <div>
              <h1 className="top-bar-title">
                SpaceX Launch Tracker — Flight Telemetry Manual
              </h1>
              <p className="top-bar-subtitle">
                0px architectural grid · Live drum-plotter telemetry · GraphQL feed
              </p>
            </div>
          </div>

          <nav className="top-bar-actions" aria-label="Sheet navigation and motion control">
            <Link
              to="/"
              className="top-bar-btn"
              data-active={String(!isDetailRoute)}
              onClick={(e) =>
                navigateSheet(e, '/', {
                  flightNumber: dossierTargetFlight,
                  focusId: 'manifest-heading',
                })
              }
            >
              Sheet 01 · Manifest
            </Link>
            <Link
              to={`/launch/${dossierTargetFlight}`}
              className="top-bar-btn"
              data-active={String(isDetailRoute)}
              onClick={(e) =>
                navigateSheet(e, `/launch/${dossierTargetFlight}`, {
                  flightNumber: dossierTargetFlight,
                  focusId: 'detail-heading',
                })
              }
            >
              Sheet 02 · Dossier (#{padFlight(dossierTargetFlight)})
            </Link>
            <button
              type="button"
              id="motion-toggle"
              className="top-bar-btn"
              onClick={toggleMotion}
            >
              {motionPaused ? 'Play Motion' : 'Pause Motion'}
            </button>
          </nav>
        </div>
      </header>

      <main
        className="manual-stage"
        data-motion={motionPaused ? 'paused' : 'running'}
      >
        <div id="sheet-frame" className="sheet-frame">
          <RegCrosshair className="reg-mark reg-tl" />
          <RegCrosshair className="reg-mark reg-tr" />
          <RegCrosshair className="reg-mark reg-bl" />
          <RegCrosshair className="reg-mark reg-br" />

          {/* 5-Cell Engineering Title Block */}
          <section
            aria-label="Document title block"
            className="title-block-wrapper"
          >
            <div className="title-block-grid">
              <div className="title-cell">
                <div className="cell-kicker-label">Document ID</div>
                <div className="cell-value">
                  <span className="live-dot" aria-hidden="true" />
                  <span>
                    KSC-SPX-{padFlight(stats.latestFlight)} // REV B
                  </span>
                </div>
              </div>
              <div className="title-cell">
                <div className="cell-kicker-label">Logged Flights</div>
                <div className="cell-value">{stats.totalLogged} MISSIONS</div>
              </div>
              <div className="title-cell">
                <div className="cell-kicker-label">Nominal Rate</div>
                <div className="cell-value">{stats.nominalRate} VERIFIED</div>
              </div>
              <div className="title-cell">
                <div className="cell-kicker-label">Active Fleet</div>
                <div className="cell-value">{stats.activeFleet}</div>
              </div>
              <div className="title-cell title-cell-span">
                <div className="cell-kicker-label">
                  Elapsed Since #{padFlight(stats.latestFlight)}
                </div>
                <div id="elapsed-clock" className="cell-value">
                  {elapsedText}
                </div>
              </div>
            </div>
          </section>

          {/* Editorial Flight Brief + Live Plotter Split */}
          <section aria-label="Mission plotter overview" className="hero-split">
            <div className="hero-brief-col">
              <div className="hero-brief-body">
                <h2 className="hero-heading">SpaceX Orbital Launch Manifest</h2>
                <p className="hero-copy">
                  Archival launch index and telemetry sheets backed by the live
                  GraphQL flight feed. Inspect any cell below to transition into
                  its vehicle elevation dossier, or hover to plot its ascent
                  curve on the X-Y recorder.
                </p>
              </div>

              <div className="tracking-wrapper">
                <div className="tracking-grid">
                  <div className="tracking-cell">
                    <div className="tracking-label">Tracked Mission</div>
                    <div className="tracking-value">
                      {trackedLaunch
                        ? `#${padFlight(trackedLaunch.flight_number)} · ${trackedLaunch.mission_name}`
                        : '#---- · STANDBY'}
                    </div>
                  </div>
                  <div className="tracking-cell">
                    <div className="tracking-label">Launch Vehicle</div>
                    <div className="tracking-value">
                      {trackedLaunch
                        ? `${trackedLaunch.rocket?.rocket_name ?? 'Unknown'} · ${trackedLaunch.rocket?.rocket_type ?? 'Unknown'}`
                        : 'Pending'}
                    </div>
                  </div>
                  <div className="tracking-cell">
                    <div className="tracking-label">Flight Regime</div>
                    <div className="tracking-value tracking-value-accent">
                      {profile.regime}
                    </div>
                  </div>
                  <div className="tracking-cell">
                    <div className="tracking-label">Plotter Readout</div>
                    <div className="tracking-value">{profile.readout}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="plotter-col">
              <div className="plotter-header">
                <span>FIG 1.0 — X-Y ASCENT TRAJECTORY RECORDER</span>
                <span>DOWNRANGE VS. ALTITUDE (INTERPOLATED LIVE)</span>
              </div>
              <div className="plotter-canvas-box">
                <PlotterCanvas launch={trackedLaunch} motionPaused={motionPaused} />
              </div>
            </div>
          </section>

          <Outlet />
        </div>
      </main>
    </>
  );
}
