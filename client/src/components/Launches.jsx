import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { LAUNCHES_QUERY } from '../graphql/queries.js';
import { computeManifestStats, filterLaunches } from '../lib/telemetry.js';
import LaunchItem from './LaunchItem.jsx';
import { IconSearch } from './Icons.jsx';

export default function Launches() {
  const { loading, error, data, refetch } = useQuery(LAUNCHES_QUERY);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const launches = data?.launches ?? [];
  const stats = computeManifestStats(launches);
  const filtered = filterLaunches(launches, { filter, query });

  const resetFilters = () => {
    setFilter('all');
    setQuery('');
  };

  return (
    <section id="view-manifest" aria-labelledby="manifest-heading">
      <div className="manifest-toolbar">
        <div className="manifest-title-row">
          <h3
            id="manifest-heading"
            tabIndex={-1}
            className="vt-title-target section-heading"
          >
            Flight Log Ledger
          </h3>
          <span className="record-counter">
            {loading
              ? 'QUERYING TELEMETRY FEED...'
              : `SHOWING ${filtered.length} OF ${launches.length} RECORDS`}
          </span>
        </div>

        <div className="toolbar-controls">
          <div className="search-wrap">
            <IconSearch className="search-icon" />
            <label htmlFor="mission-search" className="sr-only">
              Search mission, flight number, or rocket
            </label>
            <input
              id="mission-search"
              type="search"
              className="manual-input"
              placeholder="Search mission, #flight, rocket..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div
            className="filter-group"
            role="group"
            aria-label="Filter flights by status"
          >
            <button
              type="button"
              className="manual-btn"
              aria-pressed={String(filter === 'all')}
              onClick={() => setFilter('all')}
            >
              All ({launches.length})
            </button>
            <button
              type="button"
              className="manual-btn"
              aria-pressed={String(filter === 'success')}
              onClick={() => setFilter('success')}
            >
              Nominal ({stats.nominalCount})
            </button>
            <button
              type="button"
              className="manual-btn"
              aria-pressed={String(filter === 'failed')}
              onClick={() => setFilter('failed')}
            >
              Anomaly ({stats.anomalyCount})
            </button>
          </div>
        </div>
      </div>

      {loading && launches.length === 0 && (
        <div className="state-panel" role="status">
          <p className="state-title">ACQUIRING GRAPHQL MANIFEST</p>
          <p className="state-detail">
            Loading flight telemetry records from /graphql.
          </p>
        </div>
      )}

      {error && (
        <div className="state-panel" role="alert">
          <p className="state-title">TELEMETRY LINK ERROR</p>
          <p className="state-detail">{error.message}</p>
          <button
            type="button"
            className="manual-btn"
            onClick={() => refetch()}
          >
            Retry Feed Query
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="state-panel">
          <p className="state-title">ZERO FLIGHT RECORDS MATCH QUERY</p>
          <p className="state-detail">
            Adjust your mission query or clear active status filters to view all{' '}
            {launches.length} records.
          </p>
          <button
            type="button"
            className="manual-btn"
            onClick={resetFilters}
          >
            Reset Ledger Filters
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="welded-grid-wrap">
          <div id="launch-grid" className="welded-grid">
            {filtered.map((launch, index) => (
              <LaunchItem
                key={launch.flight_number}
                launch={launch}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
