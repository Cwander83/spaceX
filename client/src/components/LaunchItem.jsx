import { Link } from 'react-router-dom';
import { formatTimestamps, padFlight } from '../lib/telemetry.js';
import { useSheet } from '../context/SheetContext.jsx';
import { IconArrowRight, IconCheck, IconCross } from './Icons.jsx';

export default function LaunchItem({ launch, index }) {
  const {
    flight_number,
    mission_name,
    launch_year,
    launch_date_local,
    launch_success,
    rocket,
  } = launch;

  const { setHoveredFlight, vtFlight, navigateSheet } = useSheet();
  const isTransitioning = vtFlight === flight_number;
  const { utc, local } = formatTimestamps(launch_date_local);
  const statusKey = launch_success ? 'nominal' : 'anomaly';
  const statusLabel = launch_success ? 'NOMINAL' : 'ANOMALY';
  const targetPath = `/launch/${flight_number}`;

  return (
    <article
      className="launch-cell launch-cell-enter"
      style={{
        '--stagger': String(index),
        ...(isTransitioning ? { viewTransitionName: 'launch-card' } : null),
      }}
      data-flight={flight_number}
      onPointerEnter={() => setHoveredFlight(flight_number)}
      onFocus={() => setHoveredFlight(flight_number)}
    >
      <div className="launch-cell-body">
        <div className="launch-cell-top">
          <div className="cell-index">{padFlight(flight_number)}</div>
          <span className="stamp-badge" data-status={statusKey}>
            {launch_success ? <IconCheck /> : <IconCross />}
            <span>{statusLabel}</span>
          </span>
        </div>

        <div>
          <h4
            className="vt-title-target cell-title"
            style={isTransitioning ? { viewTransitionName: 'launch-title' } : undefined}
          >
            {mission_name}
          </h4>

          <div className="cell-specs">
            <span className="cell-spec-tag">
              {rocket?.rocket_name || 'Unknown Vehicle'}
            </span>
            <span className="cell-spec-tag">
              {rocket?.rocket_type || 'Unknown Config'}
            </span>
            <span className="cell-spec-tag">{launch_year || '----'}</span>
          </div>
        </div>

        <div className="cell-timestamp-wrap">
          <time
            dateTime={launch_date_local || undefined}
            className="cell-timestamp"
          >
            {utc}
            <br />
            Local: {local}
          </time>
        </div>
      </div>

      <Link
        to={targetPath}
        className="cell-cta"
        onClick={(e) =>
          navigateSheet(e, targetPath, {
            flightNumber: flight_number,
            focusId: 'detail-heading',
          })
        }
      >
        <span>Inspect Flight Dossier</span>
        <IconArrowRight className="cta-arrow" />
      </Link>
    </article>
  );
}
