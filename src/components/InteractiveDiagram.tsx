import React, { useState } from 'react';
import { Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface InteractiveDiagramProps {
  diagramType: string;
  categorySlug: string;
}

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({
  diagramType,
  categorySlug,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [activeNode, setActiveNode] = useState<number>(0);

  if (!diagramType || diagramType === 'none') {
    return null;
  }

  const renderSvgSchematic = () => {
    // Computers schematics
    if (
      diagramType.startsWith('cpu_') ||
      diagramType.startsWith('cache_') ||
      diagramType.startsWith('motherboard_') ||
      diagramType.startsWith('network_') ||
      diagramType.startsWith('storage_') ||
      categorySlug === 'computers'
    ) {
      const stages = [
        { label: 'IF: Instruction Fetch', detail: 'Reads 64B line from L1i Cache + Branch Target Buffer' },
        { label: 'ID: Decode & Rename', detail: 'Translates macro-ops to RISC uops & maps physical registers' },
        { label: 'EX: ALU / SIMD Issue', detail: 'Out-of-Order Reservation Stations dispatch to Execution Ports' },
        { label: 'MEM: L1d / TLB Access', detail: 'VIPT Load/Store queue probes L1 Data Cache & L2/L3 hierarchy' },
        { label: 'WB: ROB Commit', detail: 'Retires instructions in-order from Reorder Buffer to registers' },
      ];
      return (
        <div className="space-y-3">
          <svg
            viewBox="0 0 680 190"
            className="w-full h-auto rounded-lg bg-[#161719] border border-[#3A3B3F] p-2"
            role="img"
            aria-label="Interactive Computer Architecture Schematic"
          >
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E34843" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#E34843" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {/* Bus Backbone */}
            <line x1="30" y1="95" x2="650" y2="95" stroke="#E34843" strokeWidth="2.5" strokeDasharray="6 4" />
            {stages.map((st, idx) => {
              const x = 22 + idx * 128;
              const isSelected = activeNode === idx;
              return (
                <g
                  key={st.label}
                  onClick={() => setActiveNode(idx)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x}
                    y={38}
                    width={112}
                    height={110}
                    rx={10}
                    fill={isSelected ? 'url(#cpuGrad)' : '#292A2D'}
                    stroke={isSelected ? '#E34843' : '#3A3B3F'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />
                  <text
                    x={x + 56}
                    y={72}
                    textAnchor="middle"
                    fill="#E34843"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    STAGE 0{idx + 1}
                  </text>
                  <text
                    x={x + 56}
                    y={98}
                    textAnchor="middle"
                    fill="#F5F5F4"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {st.label.split(':')[0]}
                  </text>
                  <text
                    x={x + 56}
                    y={118}
                    textAnchor="middle"
                    fill="#ADAEAF"
                    fontSize="9"
                  >
                    {st.label.split(':')[1]?.trim()}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex items-center justify-between text-xs text-[#F5F5F4] bg-[#161719] border border-[#3A3B3F] rounded-lg px-3.5 py-2">
            <span>
              <strong className="text-[#E34843] font-mono">{stages[activeNode].label}:</strong>{' '}
              {stages[activeNode].detail}
            </span>
            <span className="text-[#ADAEAF] font-mono text-[11px] shrink-0 ml-2">Click node to inspect</span>
          </div>
        </div>
      );
    }

    // Cars & Motorcycles mechanical schematics
    if (
      diagramType.startsWith('engine_') ||
      diagramType.startsWith('turbo') ||
      diagramType.startsWith('transmission_') ||
      diagramType.startsWith('differential_') ||
      diagramType.startsWith('suspension_') ||
      diagramType.startsWith('moto_') ||
      categorySlug === 'cars' ||
      categorySlug === 'motorcycles'
    ) {
      const mechNodes = [
        { label: '01. Intake / Charge Path', detail: 'Venturi / Compressor pressurizes air charge through intercooler into intake port' },
        { label: '02. Combustion & Valvetrain', detail: 'DOHC / Desmodromic cams actuate valves; spark/compression ignites mixture at TDC' },
        { label: '03. Crankpin & Primary Drive', detail: 'Reciprocating piston linear force converts to rotational torque at crankshaft journal' },
        { label: '04. Final Drive & Kinematics', detail: 'Slipper clutch, gearbox ratios, and differential/swingarm anti-squat deliver traction' },
      ];
      return (
        <div className="space-y-3">
          <svg
            viewBox="0 0 680 190"
            className="w-full h-auto rounded-lg bg-[#161719] border border-[#3A3B3F] p-2"
            role="img"
            aria-label="Interactive Powertrain and Chassis Kinematics Schematic"
          >
            {/* Mechanical Flow Vectors */}
            <path
              d="M 55 95 C 190 35, 320 155, 625 95"
              fill="none"
              stroke="#E34843"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
            {mechNodes.map((node, idx) => {
              const x = 25 + idx * 160;
              const isSelected = activeNode === idx;
              return (
                <g
                  key={node.label}
                  onClick={() => setActiveNode(idx)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x}
                    y={40}
                    width={142}
                    height={108}
                    rx={10}
                    fill={isSelected ? '#292A2D' : '#161719'}
                    stroke={isSelected ? '#E34843' : '#3A3B3F'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />
                  <circle
                    cx={x + 26}
                    cy={68}
                    r={12}
                    fill={isSelected ? '#E34843' : '#292A2D'}
                  />
                  <text
                    x={x + 26}
                    y={72}
                    textAnchor="middle"
                    fill={isSelected ? '#F5F5F4' : '#E34843'}
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    {idx + 1}
                  </text>
                  <text
                    x={x + 71}
                    y={104}
                    textAnchor="middle"
                    fill="#F5F5F4"
                    fontSize="10.5"
                    fontWeight="600"
                  >
                    {node.label.replace(/^\d+\.\s*/, '')}
                  </text>
                  <text
                    x={x + 71}
                    y={126}
                    textAnchor="middle"
                    fill="#ADAEAF"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    TELEMETRY NODE
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex items-center justify-between text-xs text-[#F5F5F4] bg-[#161719] border border-[#3A3B3F] rounded-lg px-3.5 py-2">
            <span>
              <strong className="text-[#E34843] font-mono">{mechNodes[activeNode % mechNodes.length].label}:</strong>{' '}
              {mechNodes[activeNode % mechNodes.length].detail}
            </span>
            <span className="text-[#ADAEAF] font-mono text-[11px] shrink-0 ml-2">Interactive Blueprint</span>
          </div>
        </div>
      );
    }

    // Geography & Navigation schematic
    if (diagramType.startsWith('geo_') || categorySlug === 'traveling') {
      const geoNodes = [
        { label: 'Great Circle Orthodrome', detail: 'Shortest spherical surface arc between two coordinates (curved on Mercator)' },
        { label: 'Rhumb Line (Loxodrome)', detail: 'Constant compass bearing crossing all meridians at the same angle' },
        { label: 'Coriolis & Jet Stream', detail: 'f = 2Ω sin(φ) deflects upper-tropospheric westerly wind ribbons' },
        { label: 'Geodetic Datum WGS84', detail: '60 Nautical Miles per 1° latitude arc (1 NM = 1,852 meters)' },
      ];
      return (
        <div className="space-y-3">
          <svg
            viewBox="0 0 680 190"
            className="w-full h-auto rounded-lg bg-[#161719] border border-[#3A3B3F] p-2"
            role="img"
            aria-label="Interactive Geodesy and Navigation Projection Chart"
          >
            {/* Graticule grid */}
            {[90, 210, 340, 470, 590].map((lx) => (
              <line key={lx} x1={lx} y1="20" x2={lx} y2="170" stroke="#292A2D" strokeWidth="1" />
            ))}
            {[45, 95, 145].map((ly) => (
              <line key={ly} x1="40" y1={ly} x2="640" y2={ly} stroke="#292A2D" strokeWidth="1" />
            ))}
            {/* Great Circle Arc vs Rhumb Line */}
            <path d="M 90 135 Q 340 25 590 115" fill="none" stroke="#E34843" strokeWidth="3" />
            <line x1="90" y1="135" x2="590" y2="115" stroke="#ADAEAF" strokeWidth="2" strokeDasharray="6 4" />
            {geoNodes.map((g, idx) => {
              const x = 90 + idx * 165;
              const y = idx === 1 || idx === 2 ? 72 : 125;
              const isSelected = activeNode === idx;
              return (
                <g key={g.label} onClick={() => setActiveNode(idx)} className="cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 14 : 10}
                    fill={isSelected ? '#E34843' : '#292A2D'}
                    stroke="#E34843"
                    strokeWidth="2.5"
                  />
                  <text
                    x={x}
                    y={y + 28}
                    textAnchor="middle"
                    fill="#F5F5F4"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {g.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex items-center justify-between text-xs text-[#F5F5F4] bg-[#161719] border border-[#3A3B3F] rounded-lg px-3.5 py-2">
            <span>
              <strong className="text-[#E34843] font-mono">{geoNodes[activeNode % geoNodes.length].label}:</strong>{' '}
              {geoNodes[activeNode % geoNodes.length].detail}
            </span>
            <span className="text-[#ADAEAF] font-mono text-[11px] shrink-0 ml-2">Navigation Graticule</span>
          </div>
        </div>
      );
    }

    // Programming & Algorithms schematic
    const progNodes = [
      { label: 'Call Stack & Registers', detail: 'LIFO stack frames with O(1) push/pop and lexical scope pointers' },
      { label: 'Microtask Queue', detail: 'Drains Promise.then() & queueMicrotask() callbacks immediately after stack clears' },
      { label: 'Heap & Tri-Color GC', detail: 'Dynamic object graph maintained via Write Barriers (White/Gray/Black invariant)' },
      { label: 'B+ Tree / Hash Index', detail: 'O(log N) balanced page trees & O(1) amortized hash buckets' },
    ];
    return (
      <div className="space-y-3">
        <svg
          viewBox="0 0 680 190"
          className="w-full h-auto rounded-lg bg-[#161719] border border-[#3A3B3F] p-2"
          role="img"
          aria-label="Interactive Data Structure and Runtime Execution Diagram"
        >
          <line x1="80" y1="95" x2="600" y2="95" stroke="#E34843" strokeWidth="2" />
          {progNodes.map((n, idx) => {
            const x = 25 + idx * 160;
            const isSelected = activeNode === idx;
            return (
              <g key={n.label} onClick={() => setActiveNode(idx)} className="cursor-pointer">
                <rect
                  x={x}
                  y={42}
                  width={142}
                  height={104}
                  rx={10}
                  fill={isSelected ? '#292A2D' : '#161719'}
                  stroke={isSelected ? '#E34843' : '#3A3B3F'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                />
                <text
                  x={x + 71}
                  y={76}
                  textAnchor="middle"
                  fill="#E34843"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  NODE 0x0{idx + 1}
                </text>
                <text
                  x={x + 71}
                  y={104}
                  textAnchor="middle"
                  fill="#F5F5F4"
                  fontSize="10.5"
                  fontWeight="600"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex items-center justify-between text-xs text-[#F5F5F4] bg-[#161719] border border-[#3A3B3F] rounded-lg px-3.5 py-2">
          <span>
            <strong className="text-[#E34843] font-mono">{progNodes[activeNode % progNodes.length].label}:</strong>{' '}
            {progNodes[activeNode % progNodes.length].detail}
          </span>
          <span className="text-[#ADAEAF] font-mono text-[11px] shrink-0 ml-2">Interactive AST / Memory</span>
        </div>
      </div>
    );
  };

  return (
    <div className="my-4 rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-[#ADAEAF]">
          <Sparkles className="w-3.5 h-3.5 text-[#E34843]" />
          <span>Interactive Reference Schematic</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[#F5F5F4]">{diagramType.replace(/_/g, ' ').toUpperCase()}</span>
        </div>
        <button
          type="button"
          onClick={() => setZoomed(!zoomed)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-[#161719] text-[#F5F5F4] border border-[#3A3B3F] hover:border-[#E34843] transition-colors whitespace-nowrap shrink-0"
          aria-label={zoomed ? 'Collapse schematic diagram' : 'Zoom schematic diagram'}
        >
          {zoomed ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{zoomed ? 'Reset View' : 'Expand Diagram'}</span>
        </button>
      </div>

      <div className={zoomed ? 'scale-[1.02] transition-transform duration-150' : ''}>
        {renderSvgSchematic()}
      </div>
    </div>
  );
};
