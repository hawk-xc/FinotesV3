'use client';

import React, { useMemo, useCallback } from 'react';
import { AreaClosed, Line, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import {
  withTooltip,
  Tooltip,
  TooltipWithBounds,
  defaultStyles,
} from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { max, extent, bisector } from '@visx/vendor/d3-array';
import { timeFormat } from '@visx/vendor/d3-time-format';

interface FinanceData {
  id: string;
  amount: number;
  type: "expense" | "income";
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

export const background = '#ffffff';
export const background2 = '#f5f5f5';
export const accentColor = '#EF9A9A';
export const accentColorDark = '#1d4ed8';

const tooltipStyles = {
  ...defaultStyles,
  background: 'white',
  border: '1px solid #e5e7eb',
  color: '#111827',
  fontSize: '12px',
  padding: '8px 12px',
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const formatDate = timeFormat("%b %d, '%y");

// Helper functions to work with your finance data
const getDate = (d: { date: Date; amount: number }) => d.date;
const getAmountValue = (d: { date: Date; amount: number }) => d.amount;

const bisectDate = bisector<FinanceData, Date>((d) => new Date(d.timestamp.seconds * 1000)).left;

export type AreaProps = {
  width: number;
  height: number;
  data: FinanceData[];
  margin?: { top: number; right: number; bottom: number; left: number };
};

export default withTooltip<AreaProps, FinanceData>(
  ({
    width,
    height,
    data,
    margin = { top: 20, right: 20, bottom: 40, left: 40 },
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  }: AreaProps & WithTooltipProvidedProps<FinanceData>) => {
    if (width < 10) return null;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return null;

    const groupDataByDate = (data: FinanceData[]) => {
      const grouped: Record<string, { date: Date; amount: number }> = {};

      data.forEach((item) => {
        if (!item.timestamp?.seconds) return;
      
        const date = new Date(item.timestamp.seconds * 1000);
        if (isNaN(date.getTime())) return;
      
        const key = date.toISOString().split('T')[0]; // yyyy-mm-dd
      
        if (!grouped[key]) {
          grouped[key] = {
            date: new Date(key),
            amount: 0,
          };
        }
      
        grouped[key].amount += Math.abs(item.amount);
      });
    
      return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
    };



    // Filter only expense data for the chart
    const expenseData = useMemo(() => {
      const filtered = data.filter(
        (d) =>
          d.type === 'expense' &&
          d.timestamp?.seconds &&
          !isNaN(new Date(d.timestamp.seconds * 1000).getTime())
      );
      return groupDataByDate(filtered);
    }, [data]);


    const dateScale = useMemo(
      () =>
        scaleTime({
          range: [margin.left, innerWidth + margin.left],
          domain: extent(expenseData, getDate) as [Date, Date],
        }),
      [innerWidth, margin.left, expenseData],
    );

    const amountScale = useMemo(
      () =>
        scaleLinear({
          range: [innerHeight + margin.top, margin.top],
          domain: [0, (max(expenseData, getAmountValue) || 0) * 1.1], // Add 10% padding
          nice: true,
        }),
      [margin.top, innerHeight, expenseData],
    );

    const handleTooltip = useCallback(
      (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
        const { x } = localPoint(event) || { x: 0 };
      
        const x0 = dateScale.invert(x);
        const index = bisector<{ date: Date; amount: number }, Date>((d) => d.date).left(expenseData, x0, 1);
        const d0 = expenseData[index - 1];
        const d1 = expenseData[index];
        let d = d0;
      
        if (d1 && d0) {
          d = x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf() ? d1 : d0;
        }
      
        showTooltip({
          tooltipData: d,
          tooltipLeft: x,
          tooltipTop: amountScale(d.amount),
        });
      },
      [showTooltip, amountScale, dateScale, expenseData],
    );


    return (
      <div>
        <svg width={width} height={height}>
          <rect x={0} y={0} width={width} height={height} fill="url(#area-background-gradient)" rx={14} />
          <LinearGradient id="area-background-gradient" from={background} to={background2} />
          <LinearGradient id="area-gradient" from={accentColor} to={accentColor} toOpacity={0.1} />
          <GridRows
            left={margin.left}
            scale={amountScale}
            width={innerWidth}
            stroke={accentColor}
            strokeOpacity={0.05}
          />
          <GridColumns
            top={margin.top}
            scale={dateScale}
            height={innerHeight}
            stroke={accentColor}
            strokeOpacity={0.1}
          />
          <AreaClosed<FinanceData>
            data={expenseData}
            x={(d) => dateScale(getDate(d)) ?? 0}
            y={(d) => amountScale(getAmountValue(d)) ?? 0}
            yScale={amountScale}
            strokeWidth={2}
            stroke="url(#area-gradient)"
            fill="url(#area-gradient)"
            curve={curveMonotoneX}
          />
          <Bar
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          {tooltipData?.date && (
            <>
              <TooltipWithBounds
                top={tooltipTop - 12}
                left={tooltipLeft + 12}
                style={tooltipStyles}
              >
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(tooltipData.amount)}
              </TooltipWithBounds>
              
              <Tooltip
                top={innerHeight + margin.top - 14}
                left={tooltipLeft}
                style={{
                  ...defaultStyles,
                  minWidth: 72,
                  textAlign: 'center',
                  transform: 'translateX(-50%)',
                }}
              >
                {formatDate(tooltipData.date)}
              </Tooltip>
            </>
          )}
        </svg>
        {tooltipData && (
          <>
            <TooltipWithBounds top={tooltipTop - 12} left={tooltipLeft + 12} style={tooltipStyles}>
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(getAmountValue(tooltipData))}
            </TooltipWithBounds>
            <Tooltip
              top={innerHeight + margin.top - 14}
              left={tooltipLeft}
              style={{
                ...defaultStyles,
                minWidth: 72,
                textAlign: 'center',
                transform: 'translateX(-50%)',
              }}
            >
              {formatDate(getDate(tooltipData))}
            </Tooltip>
          </>
        )}
      </div>
    );
  },
);