import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { UPCOMING_LAUNCHES_QUERY } from '../graphql/queries.js';
import {
  classifyUpcomingStatus,
  filterUpcomingLaunches,
  formatCountdownTo,
  formatTimestamps,
  padFlight,
} from '../lib/telemetry.js';
import {
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCross,
  IconExternalLink,
  IconSearch,
} from './Icons.jsx';

export default function UpcomingLaunches() {
  const { loading, error, data, refetch } = useQuery(UPCOMING_LAUNCHES_QUERY);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [expandedMap, setExpandedMap] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = data?.upcomingLaunches ?? [];
  const goCount = upcoming.filter((item) => {
    const abbrev = String(item?.status_abbrev || '').toLowerCase();
    return abbrev === 'go' || abbrev === 'in flight';
  }).length;
  const pendingCount = upcoming.length - goCount;
  const filtered = filterUpcomingLaunches(upcoming, {
    status: statusFilter,
    query,
  });

  const resetFilters = () => {
    setStatusFilter('all');
    setQuery('');
  };

  const toggleExpanded = (launchId) => {
    setExpandedMap((prev) => ({ ...prev, [launchId]: !prev[launchId] }));
  };

  return (
    <section id="view-upcoming" aria-labelledby="upcoming-heading">
      <div className="manifest-toolbar">
        <div className="manifest-title-row">
          <h3
            id="upcoming-heading"
            tabIndex={-1}
            className="vt-title-target section-heading"
          >
            Upcoming Launch Schedule
          </h3>
          <span className="record-counter">
            {loading
              ? 'QUERYING UPCOMING MANIFEST...'
              : `SHOWING ${filtered.length} OF ${upcoming.length} SCHEDULED`}
          </span>
        </div>

        <div className="toolbar-controls">
          <div className="search-wrap">
            <IconSearch className="search-icon" />
            <label htmlFor="upcoming-search" className="sr-only">
              Search upcoming mission, pad, orbit, or rocket
            </label>
            <input
              id="upcoming-search"
              type="search"
              className="manual-input"
              placeholder="Search mission, pad, orbit, rocket..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div
            className="filter-group"
            role="group"
            aria-label="Filter upcoming flights by readiness status"
          >
            <button
              type="button"
              className="manual-btn"
              aria-pressed={String(statusFilter === 'all')}
              onClick={() => setStatusFilter('all')}
            >
              All ({upcoming.length})
            </button>
            <button
              type="button"
              className="manual-btn"
              aria-pressed={String(statusFilter === 'go')}
              onClick={() => setStatusFilter('go')}
            >
              Go ({goCount})
            </button>
            <button
              type="button"
              className="manual-btn"
              aria-pressed={String(statusFilter === 'pending')}
              onClick={() => setStatusFilter('pending')}
            >
              TBD / TBC ({pendingCount})
            </button>
          </div>
        </div>
      </div>

      {loading && upcoming.length === 0 && (
        <div className="state-panel" role="status">
          <p className="state-title">ACQUIRING UPCOMING LAUNCH WINDOW FEED</p>
          <p className="state-detail">
            Loading scheduled launch windows and range assignments from /graphql.
          </p>
        </div>
      )}

      {error && upcoming.length === 0 && (
        <div className="state-panel" role="alert">
          <p className="state-title">SCHEDULE LINK ERROR</p>
          <p className="state-detail">{error.message}</p>
          <button
            type="button"
            className="manual-btn"
            onClick={() => refetch()}
          >
            Retry Schedule Query
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="state-panel">
          <p className="state-title">ZERO UPCOMING LAUNCHES MATCH QUERY</p>
          <p className="state-detail">
            Adjust your search query or readiness filter to view all{' '}
            {upcoming.length} scheduled missions.
          </p>
          <button
            type="button"
            className="manual-btn"
            onClick={resetFilters}
          >
            Reset Schedule Filters
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="welded-grid-wrap">
          <div id="upcoming-grid" className="welded-grid">
            {filtered.map((item, index) => {
              const { badgeStatus, label } = classifyUpcomingStatus(
                item.status_abbrev
              );
              const { clock, phase } = formatCountdownTo(item.net, nowMs);
              const { utc, local } = formatTimestamps(item.net);
              const isExpanded = Boolean(expandedMap[item.launch_id]);

              return (
                <article
                  key={item.launch_id}
                  className="launch-cell upcoming-cell launch-cell-enter"
                  style={{ '--stagger': String(index) }}
                >
                  <div className="launch-cell-body">
                    <div className="launch-cell-top">
                      <div className="cell-index">
                        {item.flight_number != null
                          ? `#${padFlight(item.flight_number)}`
                          : 'FLT TBD'}
                      </div>
                      <span className="stamp-badge" data-status={badgeStatus}>
                        {badgeStatus === 'nominal' ? (
                          <IconCheck />
                        ) : badgeStatus === 'anomaly' ? (
                          <IconCross />
                        ) : (
                          <IconClock />
                        )}
                        <span>{label}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="cell-title">{item.mission_name}</h4>
                      <div className="cell-specs">
                        <span className="cell-spec-tag">
                          {item.rocket?.rocket_name || 'Unknown Vehicle'}
                        </span>
                        <span className="cell-spec-tag">
                          {item.rocket?.rocket_type || 'Unknown Config'}
                        </span>
                        <span className="cell-spec-tag">
                          {item.orbit_abbrev || 'ORBIT TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="countdown-strip">
                      <span className="countdown-label">NET COUNTDOWN</span>
                      <span className="countdown-clock" data-phase={phase}>
                        {phase === 'window-open' ? 'WINDOW OPEN' : clock}
                      </span>
                    </div>

                    <div className="cell-timestamp-wrap">
                      <div className="upcoming-pad-line">
                        {item.pad_name || 'Pad Unassigned'}
                        {item.pad_location ? ` · ${item.pad_location}` : ''}
                      </div>
                      <time
                        dateTime={item.net || undefined}
                        className="cell-timestamp"
                      >
                        NET {utc}
                        <br />
                        Local: {local}
                      </time>
                    </div>

                    {item.mission_description ? (
                      <p
                        className="upcoming-desc"
                        data-expanded={String(isExpanded)}
                      >
                        {item.mission_description}
                      </p>
                    ) : null}
                  </div>

                  {item.webcast_url ? (
                    <a
                      href={item.webcast_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cell-cta"
                    >
                      <span>Watch Live Webcast</span>
                      <IconExternalLink className="cta-arrow" />
                    </a>
                  ) : item.mission_description ? (
                    <button
                      type="button"
                      className="cell-cta"
                      aria-expanded={String(isExpanded)}
                      onClick={() => toggleExpanded(item.launch_id)}
                    >
                      <span>
                        {isExpanded
                          ? 'Collapse Mission Brief'
                          : 'Read Mission Brief'}
                      </span>
                      <IconChevronRight className="cta-arrow" />
                    </button>
                  ) : (
                    <div className="upcoming-footer-bar">
                      <span>{item.status_name || 'Schedule Pending'}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
