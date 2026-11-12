import { useState } from 'react';

const PART_NOTES = {
  fairing:
    'A · PAYLOAD FAIRING: Composite aerodynamic shroud protecting spacecraft payload stack until orbital separation.',
  stage2:
    'B · SECOND STAGE: Vacuum-rated orbital insertion stage executing primary orbital circularization burn.',
  stage1:
    'C · FIRST STAGE BOOSTER: Reusable propulsion core equipped with upper grid fins and deployable landing legs.',
};

const DEFAULT_CAPTION =
  'Select Fairing, Stage 2, or Stage 1 above (or click elevation callouts) to inspect structural section notes.';

export default function VehicleSchematic({ rocketName, rocketType, launchSuccess }) {
  const [selectedPart, setSelectedPart] = useState(null);

  const handleKeyDown = (part) => (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedPart(part);
    }
  };

  return (
    <div className="schematic-col">
      <div className="plotter-header" style={{ color: 'var(--ink)' }}>
        <span style={{ fontWeight: 700 }}>FIG 2.0 // SCHEMATIC ELEVATION</span>
        <span style={{ color: 'var(--ink-muted)' }}>
          {rocketName || 'Unknown'} · {rocketType || 'Unknown'}
        </span>
      </div>

      <div className="schematic-canvas-wrap">
        <svg
          viewBox="0 0 260 350"
          className="schematic-svg"
          role="img"
          aria-label="1968 orthographic two-stage vehicle elevation schematic"
        >
          <rect
            x="6"
            y="6"
            width="248"
            height="338"
            fill="#f8f5ee"
            stroke="#141311"
            strokeWidth="1"
          />

          <line x1="36" y1="26" x2="36" y2="274" stroke="#4e4a42" strokeWidth="1" />
          <line
            x1="30"
            y1="26"
            x2="96"
            y2="26"
            stroke="#4e4a42"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
          <line
            x1="30"
            y1="274"
            x2="96"
            y2="274"
            stroke="#4e4a42"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
          <text
            x="24"
            y="156"
            fill="#4e4a42"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            transform="rotate(-90 24 156)"
            textAnchor="middle"
          >
            SCHEMATIC ELEVATION
          </text>

          <line
            x1="130"
            y1="16"
            x2="130"
            y2="336"
            stroke="#4e4a42"
            strokeWidth="0.9"
            strokeDasharray="8 4 2 4"
          />
          <line
            x1="64"
            y1="146"
            x2="210"
            y2="146"
            stroke="#c8371d"
            strokeWidth="1"
            strokeDasharray="4 3"
          />

          <g
            className="svg-hotspot"
            tabIndex={0}
            role="button"
            aria-label="Inspect Payload Fairing"
            onClick={() => setSelectedPart('fairing')}
            onKeyDown={handleKeyDown('fairing')}
          >
            <path
              d="M115 56 Q130 20 145 56 L145 92 L115 92 Z"
              fill={selectedPart === 'fairing' ? '#e6dfd0' : '#f2ede2'}
              stroke={selectedPart === 'fairing' ? '#c8371d' : '#141311'}
              strokeWidth={selectedPart === 'fairing' ? '2' : '1.4'}
            />
            <line x1="115" y1="74" x2="145" y2="74" stroke="#141311" strokeWidth="0.8" />
            <circle cx="182" cy="52" r="3" fill="#c8371d" />
            <line x1="145" y1="52" x2="179" y2="52" stroke="#c8371d" strokeWidth="1.2" />
            <text
              x="189"
              y="55"
              fill="#141311"
              fontSize="9"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
            >
              A · FAIRING
            </text>
          </g>

          <g
            className="svg-hotspot"
            tabIndex={0}
            role="button"
            aria-label="Inspect Second Stage"
            onClick={() => setSelectedPart('stage2')}
            onKeyDown={handleKeyDown('stage2')}
          >
            <rect
              x="117"
              y="92"
              width="26"
              height="54"
              fill={selectedPart === 'stage2' ? '#e6dfd0' : '#f8f5ee'}
              stroke={selectedPart === 'stage2' ? '#c8371d' : '#141311'}
              strokeWidth={selectedPart === 'stage2' ? '2' : '1.4'}
            />
            <rect x="117" y="138" width="26" height="8" fill="#141311" />
            <circle cx="80" cy="118" r="3" fill="#c8371d" />
            <line x1="83" y1="118" x2="117" y2="118" stroke="#c8371d" strokeWidth="1.2" />
            <text
              x="48"
              y="109"
              fill="#141311"
              fontSize="9"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
            >
              B · STG 2
            </text>
          </g>

          <g
            className="svg-hotspot"
            tabIndex={0}
            role="button"
            aria-label="Inspect First Stage"
            onClick={() => setSelectedPart('stage1')}
            onKeyDown={handleKeyDown('stage1')}
          >
            <rect
              x="117"
              y="146"
              width="26"
              height="122"
              fill={selectedPart === 'stage1' ? '#e6dfd0' : '#f8f5ee'}
              stroke={selectedPart === 'stage1' ? '#c8371d' : '#141311'}
              strokeWidth={selectedPart === 'stage1' ? '2' : '1.4'}
            />
            <rect
              x="110"
              y="152"
              width="7"
              height="10"
              fill="#e6dfd0"
              stroke="#141311"
              strokeWidth="1.1"
            />
            <rect
              x="143"
              y="152"
              width="7"
              height="10"
              fill="#e6dfd0"
              stroke="#141311"
              strokeWidth="1.1"
            />
            <path
              d="M117 242 L102 268 L117 265 Z"
              fill="#e6dfd0"
              stroke="#141311"
              strokeWidth="1.2"
            />
            <path
              d="M143 242 L158 268 L143 265 Z"
              fill="#e6dfd0"
              stroke="#141311"
              strokeWidth="1.2"
            />
            <circle cx="182" cy="206" r="3" fill="#c8371d" />
            <line x1="143" y1="206" x2="179" y2="206" stroke="#c8371d" strokeWidth="1.2" />
            <text
              x="189"
              y="209"
              fill="#141311"
              fontSize="9"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
            >
              C · BOOSTER
            </text>
          </g>

          <polygon points="120,268 140,268 144,276 116,276" fill="#141311" />
          <path
            className="svg-plume"
            d="M119 276 L130 330 L141 276 Z"
            fill="#c8371d"
            fillOpacity={launchSuccess ? '0.85' : '0.22'}
          />
        </svg>
      </div>

      <div className="schematic-controls">
        <div className="stage-selector-grid">
          <button
            type="button"
            className="manual-btn"
            data-selected={String(selectedPart === 'fairing')}
            onClick={() => setSelectedPart('fairing')}
          >
            Fairing
          </button>
          <button
            type="button"
            className="manual-btn"
            data-selected={String(selectedPart === 'stage2')}
            onClick={() => setSelectedPart('stage2')}
          >
            Stage 2
          </button>
          <button
            type="button"
            className="manual-btn"
            data-selected={String(selectedPart === 'stage1')}
            onClick={() => setSelectedPart('stage1')}
          >
            Stage 1
          </button>
        </div>
        <p id="svg-part-caption" className="schematic-caption">
          {selectedPart ? PART_NOTES[selectedPart] : DEFAULT_CAPTION}
        </p>
      </div>
    </div>
  );
}
