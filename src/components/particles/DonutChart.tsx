'use client';

import React from 'react';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

interface DonutChartProps {
  width: number;
  height: number;
  data: { category: string; count: number }[];
}

export const donutColorScale = scaleOrdinal<string, string>({
  domain: [],
  range: schemeCategory10,
});

const DonutChart: React.FC<DonutChartProps> = ({ width, height, data }) => {
  const radius = Math.min(width, height) / 2;
  const donutWidth = 40;

  // Perbarui domain berdasarkan data
  donutColorScale.domain(data.map(d => d.category));

  return (
    <svg width={width} height={height}>
      <Group top={height / 2} left={width / 2}>
        <Pie
          data={data}
          pieValue={d => d.count}
          outerRadius={radius}
          innerRadius={radius - donutWidth}
          padAngle={0.01}
        >
          {pie => (
            pie.arcs.map((arc, i) => {
              const arcPath = pie.path(arc) || '';
              const fill = donutColorScale(arc.data.category);
              return (
                <g key={`arc-${arc.data.category}-${i}`}>
                  <path d={arcPath} fill={fill} stroke="#fff" strokeWidth={1} />
                </g>
              );
            })
          )}
        </Pie>
      </Group>
    </svg>
  );
};

export default DonutChart;