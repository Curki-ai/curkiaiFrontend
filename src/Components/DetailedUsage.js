import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/DetailedUsage.css";
import AiSideBarIcon from "../Images/AiSideBarIcon.svg";
import AiSmsSideBarIcon from "../Images/SmsSideBarIcon.svg";
import {
    Line
} from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
} from "chart.js";
import { IoArrowBackOutline } from "react-icons/io5";
import CustomRangeSelect from "./Modules/DetailedUsageCustomSelect";

/* ---------------- Vertical Hover Line Plugin ---------------- */

const verticalLinePlugin = {
    id: "verticalLine",
    afterDraw: chart => {
        if (chart.tooltip?._active?.length) {
            const ctx = chart.ctx;
            const x = chart.tooltip._active[0].element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#c4b5fd";
            ctx.stroke();
            ctx.restore();
        }
    }
};

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    verticalLinePlugin
);

const DetailedUsage = ({ user, onBack }) => {

    const [range, setRange] = useState("month");
    const [usageData, setUsageData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const modules = [
        { label: "Financial Health", value: "financial-health" },
        { label: "Payroll Analysis", value: "payroll-analysis" },
        { label: "Clients Profitability", value: "clients-profitability" },
        { label: "Smart Rostering", value: "smart-rostering" },
        { label: "Smart Onboarding (Staff)", value: "smart-onboarding-staff" },
        { label: "Incident Report", value: "incident-report" },
        { label: "Care Voice", value: "care-voice" }
    ];

    const [activeModule, setActiveModule] = useState(modules[0]);

    const domain = user?.email?.split("@")[1]?.toLowerCase();

    const normalizeData = (breakdown, planLimit, range) => {
        console.log("Normalizing data with", { breakdown, planLimit, range });

        let maxPoints = 31;
        if (range === "year") maxPoints = 12;
        if (range === "week") maxPoints = 7;

        const fullData = [];

        for (let i = 1; i <= maxPoints; i++) {
            let found;
            let tokens = 0;

            if (range === "week") {
                // Build last 7 days dynamically
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);

                const targetDate = new Date(startDate);
                targetDate.setDate(startDate.getDate() + (i - 1));

                const targetStr = targetDate.toISOString().split("T")[0];

                found = breakdown.find(item => item.period === targetStr);
            } else {
                found = breakdown.find(item => Number(item.period) === i);
            }

            tokens = found ? found.tokens : 0;

            let effectiveLimit = planLimit;

            if (range === "week") {
                effectiveLimit = planLimit / 4;
            }

            if (range === "month") {
                effectiveLimit = planLimit / 30;
            }

            if (range === "year") {
                effectiveLimit = planLimit;
            }

            const usagePercent =
                effectiveLimit > 0
                    ? (tokens / effectiveLimit) * 100
                    : 0;

            fullData.push({
                period: i.toString(),
                tokens,
                usagePercent
            });
        }

        return fullData;
    };
    const fetchUsage = async () => {
        if (!domain) {
            console.log("No domain found");
            return;
        }

        try {
            console.log("Fetching usage");
            console.log("Domain:", domain);
            console.log("Range:", range);
            console.log("Module:", activeModule.value);

            setLoading(true);
            setError(null);

            const res = await axios.get(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/analysis/${domain}`,
                {
                    params: {
                        range,
                        module: activeModule.value
                    }
                }
            );

            console.log("API Response:", res.data);

            setSummary(res.data);

            const normalized = normalizeData(
                res.data.breakdown || [],
                res.data.planTokenLimit,
                range
            );

            setUsageData(normalized);

        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to load usage data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();
    }, [range, activeModule]);

    /* ---------------- Chart Data ---------------- */

    const chartData = {
        labels: usageData.map(item => item.period),
        datasets: [
            {
                label: "AI Tokens",
                data: usageData.map(item => item.usagePercent),
                borderColor: "#16c79a",
                backgroundColor: "rgba(22,199,154,0.12)",
                tension: 0.45,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#5b47ff",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 3,
                borderWidth: 2.5,
                fill: true
            }
        ]
    };

    /* ---------------- Chart Options ---------------- */

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#fff",
                titleColor: "#16c79a",
                bodyColor: "#111",
                borderColor: "#e5e7eb",
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    title: function (context) {
                        if (range === "year") return `Month ${context[0].label}`;
                        if (range === "week") return `Day ${context[0].label}`;
                        return `Day ${context[0].label}`;
                    },
                    label: function (context) {
                        const dataIndex = context.dataIndex;
                        const item = usageData[dataIndex];

                        return [
                            `AI Tokens : ${item.tokens.toLocaleString()}`,
                            `Usage : ${context.raw.toFixed(1)}%`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text:
                        range === "year"
                            ? "Months of the year"
                            : range === "week"
                                ? "Days of the week"
                                : "Days of the month",
                    color: "#9ca3af",
                    font: { size: 13, weight: "500" }
                },
                grid: { display: false },
                ticks: {
                    color: "#9ca3af",
                    font: { size: 12 }
                }
            },
            y: {
                title: {
                    display: true,
                    text: "Plan Usage",
                    color: "#9ca3af",
                    font: { size: 13, weight: "500" }
                },
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25,
                    color: "#9ca3af",
                    callback: value => value + "%",
                    font: { size: 12 }
                },
                grid: {
                    color: "rgba(0,0,0,0.05)",
                    borderDash: [4, 4]
                }
            }
        }
    };

    return (
        <div className="detailed-usage-container">

            <div className="du-back" onClick={onBack}>
                <IoArrowBackOutline size={18} />
                Back
            </div>

            <div className="du-header-row">
                <div className="du-title">Detailed AI Utilisation</div>
                <CustomRangeSelect value={range} onChange={setRange} />
            </div>

            <div className="du-tabs">
                {modules.map(mod => (
                    <div
                        key={mod.value}
                        className={`du-tab ${activeModule.value === mod.value ? "active" : ""}`}
                        onClick={() => setActiveModule(mod)}
                    >
                        {mod.label}
                    </div>
                ))}
            </div>
            {error && <div className="du-error">{error}</div>}

            {loading && (
                <div className="du-loader-wrapper">
                    <div className="du-loader" />
                </div>
            )}


            {!loading && usageData.length > 0 && (
                <div className="du-chart-card">
                    <Line data={chartData} options={chartOptions} />
                </div>
            )}

            {!loading && summary && (
                <div className="du-summary-wrapper">
                    <SummaryRow
                        icon={AiSideBarIcon}
                        label="AI tokens used"
                        used={summary.totalTokensUsed}
                        limit={summary.planTokenLimit}
                        percent={summary.tokenUsagePercent}
                    />
                    <SummaryRow
                        icon={AiSmsSideBarIcon}
                        label="Sms used"
                        used={summary.totalSmsUsed}
                        limit={summary.planSmsLimit}
                        percent={summary.smsUsagePercent}
                    />
                </div>
            )}

        </div>
    );
};

const SummaryRow = ({ icon, label, used, limit, percent }) => {

    const cappedPercent = Math.min(percent, 100);
    const isOverLimit = percent > 100;

    console.log("SummaryRow", {
        label,
        used,
        limit,
        percent,
        cappedPercent,
        isOverLimit
    });

    return (
        <div className="du-summary-row">
            <div className="du-icon-box">
                <img src={icon} alt="icon" />
            </div>

            <div className="du-summary-content">
                <div className="du-summary-top">
                    <div>
                        <div className="du-summary-label">{label}</div>
                        <div className="du-summary-value">
                            {used?.toLocaleString()} / {limit?.toLocaleString()}
                        </div>
                    </div>

                    <div
                        className="du-percent"
                        style={{
                            color: isOverLimit ? "#dc2626" : "#111"
                        }}
                    >
                        {isOverLimit ? "100%+" : `${cappedPercent}%`}
                    </div>
                </div>

                <div className="du-progress-bar">
                    <div
                        className="du-progress-fill"
                        style={{
                            width: `${cappedPercent}%`,
                            backgroundColor: isOverLimit ? "#dc2626" : undefined
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DetailedUsage;