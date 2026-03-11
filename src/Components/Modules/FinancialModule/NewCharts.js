import React, { useState } from "react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

import "../../../Styles/newGraphs.css";

const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f59e0b",
    "#10b981",
    "#3b82f6"
];

/* ---------------- SAMPLE DATA ---------------- */

const BAR_DATA = {
    x: ["Dept A", "Dept B", "Dept C", "Dept D", "Dept E", "Dept F"],
    series: {
        Revenue: [12000, 18000, 14000, 21000, 22200, 23000],
        Expense: [7000, 11000, 9000, 13000, 16000, 20000]
    }
};

const LINE_DATA = {
    x: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    series: {
        Revenue: [20000, 23000, 22000, 25000, 27000],
        Expense: [15000, 16000, 15500, 17000, 17500]
    }
};

const PIE_DATA = {
    labels: ["Revenue", "Expense", "Operations", "Marketing"],
    values: [23000, 8700, 4200, 3200]
};

const STACKED_DATA = {
    x: ["Project A", "Project B", "Project C", "Project D"],
    series: {
        Planning: [40, 30, 20, 50],
        Development: [120, 100, 80, 150],
        Testing: [60, 50, 40, 70],
        Deployment: [20, 15, 10, 25]
    }
};

/* ---------------- TOOLTIP ---------------- */

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-visualizer-tooltip">
                <div className="chart-visualizer-tooltip-label">{label}</div>

                {payload.map((p, i) => (
                    <div key={i} className="chart-visualizer-tooltip-row">

                        <span className="chart-visualizer-tooltip-left">
                            <span
                                className="chart-visualizer-tooltip-dot"
                                style={{ background: p.color || p.fill }}
                            />
                            {p.name}
                        </span>

                        <span className="chart-visualizer-tooltip-value">
                            {p.value}
                        </span>

                    </div>
                ))}
            </div>
        );
    }
    return null;
};

/* ---------------- LEGEND ---------------- */

const Legend = ({ names, visible, toggle }) => {

    return (
        <div className="chart-visualizer-legend">

            {names.map((name, i) => (
                <div
                    key={name}
                    className={`chart-visualizer-legend-item ${visible.includes(name)
                        ? ""
                        : "chart-visualizer-legend-item-inactive"
                        }`}
                    onClick={() => toggle(name)}
                >

                    <span
                        className="chart-visualizer-legend-dot"
                        style={{ background: COLORS[i % COLORS.length] }}
                    />

                    <span className="chart-visualizer-legend-text">
                        {name}
                    </span>

                </div>
            ))}

        </div>
    );
};

/* ---------------- BAR CHART ---------------- */

const BarChartWrapper = ({ data }) => {

    const names = Object.keys(data.series);
    const [visible, setVisible] = useState(names);

    const toggle = name => {
        setVisible(prev =>
            prev.includes(name)
                ? prev.filter(v => v !== name)
                : [...prev, name]
        );
    };

    const chartData = data.x.map((x, i) => {
        const obj = { name: x };

        names.forEach(n => {
            obj[n] = data.series[n][i];
        });

        return obj;
    });

    return (

        <div>

            <Legend names={names} visible={visible} toggle={toggle} />

            <ResponsiveContainer width="100%" height={350}>

                <BarChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip content={<CustomTooltip />} />

                    {names.map((n, i) => (
                        <Bar
                            key={n}
                            dataKey={n}
                            fill={COLORS[i]}
                            hide={!visible.includes(n)}
                            barSize={40}              // thinner bar
                            radius={[8, 8, 0, 0]}        // rounded top corners
                        />
                    ))}

                </BarChart>

            </ResponsiveContainer>

        </div>
    );
};

/* ---------------- LINE CHART ---------------- */

const LineChartWrapper = ({ data }) => {

    const names = Object.keys(data.series);
    const [visible, setVisible] = useState(names);

    const toggle = name => {
        setVisible(prev =>
            prev.includes(name)
                ? prev.filter(v => v !== name)
                : [...prev, name]
        );
    };

    const chartData = data.x.map((x, i) => {
        const obj = { name: x };

        names.forEach(n => {
            obj[n] = data.series[n][i];
        });

        return obj;
    });

    return (

        <div>

            <Legend names={names} visible={visible} toggle={toggle} />

            <ResponsiveContainer width="100%" height={350}>

                <AreaChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip content={<CustomTooltip />} />

                    {names.map((n, i) => (
                        <Area
                            key={n}
                            dataKey={n}
                            stroke={COLORS[i]}
                            fill={COLORS[i]}
                            fillOpacity={0.2}
                            hide={!visible.includes(n)}
                            strokeWidth={3}
                        />
                    ))}

                </AreaChart>

            </ResponsiveContainer>

        </div>
    );
};

/* ---------------- PIE CHART ---------------- */

const PieChartWrapper = ({ data }) => {

    const names = data?.labels || [];

    const [visible, setVisible] = useState(names);

    const toggle = name => {
        setVisible(prev =>
            prev.includes(name)
                ? prev.filter(v => v !== name)
                : [...prev, name]
        );
    };

const chartData = data.labels.map((l, i) => ({
    name: l,
    value: data.series?.values?.[i] || 0
}));

    return (

        <div>

            <Legend names={names} visible={visible} toggle={toggle} />

            <ResponsiveContainer width="100%" height={350}>

                <PieChart>

                    <Pie
                        data={chartData.filter(d => visible.includes(d.name))}
                        dataKey="value"
                        outerRadius={130}
                    >

                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={COLORS[i]} />
                        ))}

                    </Pie>

                    <Tooltip content={<CustomTooltip />} />

                </PieChart>

            </ResponsiveContainer>

        </div>
    );
};

/* ---------------- STACKED BAR ---------------- */

const StackedBarChartWrapper = ({ data }) => {

    const names = Object.keys(data.series);
    const [visible, setVisible] = useState(names);

    const toggle = name => {
        setVisible(prev =>
            prev.includes(name)
                ? prev.filter(v => v !== name)
                : [...prev, name]
        );
    };

    const chartData = data.x.map((x, i) => {
        const obj = { name: x };

        names.forEach(n => {
            obj[n] = data.series[n][i];
        });

        return obj;
    });

    return (

        <div>

            <Legend names={names} visible={visible} toggle={toggle} />

            <ResponsiveContainer width="100%" height={350}>

                <BarChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip content={<CustomTooltip />} />

                    {names.map((n, i) => {

                        const isTop = i === names.length - 1;

                        return (
                            <Bar
                                key={n}
                                dataKey={n}
                                stackId="a"
                                fill={COLORS[i]}
                                hide={!visible.includes(n)}
                                barSize={40}
                                radius={isTop ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                            />
                        );

                    })}

                </BarChart>

            </ResponsiveContainer>

        </div>
    );
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function ChartVisualiser({ plotData }) {
    if (!plotData) return null;

    const chartType = plotData.type;
    return (
        <div className="chart-visualizer-app">

            {chartType === "bar" && (
                <div className="chart-visualizer-card">
                    <BarChartWrapper data={plotData} />
                </div>
            )}

            {chartType === "line" && (
                <div className="chart-visualizer-card">
                    <LineChartWrapper data={plotData} />
                </div>
            )}

            {chartType === "area" && (
                <div className="chart-visualizer-card">
                    <LineChartWrapper data={plotData} />
                </div>
            )}

            {chartType === "pie" && (
                <div className="chart-visualizer-card">
                    <PieChartWrapper data={plotData} />
                </div>
            )}

            {chartType === "stacked_bar" && (
                <div className="chart-visualizer-card">
                    <StackedBarChartWrapper data={plotData} />
                </div>
            )}

        </div>
    );
}