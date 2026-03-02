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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
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
    const normalizeMonthlyData = (breakdown, totalPercent) => {
        const daysInMonth = 31;
        const fullData = [];

        // calculate total tokens from breakdown
        const totalTokens = breakdown.reduce(
            (sum, item) => sum + (item.tokens || 0),
            0
        );

        for (let i = 1; i <= daysInMonth; i++) {
            const found = breakdown.find(item => {
                const day = new Date(item.period).getDate();
                return day === i;
            });

            const tokens = found ? found.tokens : 0;

            // distribute percent proportionally
            const usagePercent =
                totalTokens > 0
                    ? (tokens / totalTokens) * totalPercent
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
            console.log("[DetailedUsage] No domain found");
            return;
        }

        try {
            console.log("[DetailedUsage] Fetch start");
            console.log("Domain:", domain);
            console.log("Range:", range);
            console.log("Module:", activeModule);

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

            console.log("[DetailedUsage] Response:", res.data);

            setSummary(res.data);
            const normalized = normalizeMonthlyData(
                res.data.breakdown || [],
                res.data.tokenUsagePercent
            );
            setUsageData(normalized);

        } catch (err) {
            console.error("[DetailedUsage] Error:", err);
            setError("Failed to load usage data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();
    }, [range, activeModule]);

    const chartData = {
        labels: usageData.map(item => item.period),
        datasets: [
            {
                label: "AI Tokens",
                data: usageData.map(item => item.usagePercent), // <-- use percent
                borderColor: "#16c79a",
                backgroundColor: "rgba(22,199,154,0.12)",
                tension: 0.45,              // smooth curve
                pointRadius: 0,             // remove default dots
                pointHoverRadius: 6,
                borderWidth: 2.5,
                fill: true
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#fff",
                titleColor: "#111",
                bodyColor: "#111",
                borderColor: "#e5e7eb",
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `AI Tokens : ${context.raw}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: "#9ca3af",
                    font: {
                        size: 12
                    }
                }
            },
            y: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25,
                    color: "#9ca3af",
                    callback: function (value) {
                        return value + "%";
                    },
                    font: {
                        size: 12
                    }
                },
                grid: {
                    color: "rgba(0,0,0,0.05)",
                    borderDash: [4, 4]
                }
            }
        },
        elements: {
            line: {
                cubicInterpolationMode: "monotone"
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

                <CustomRangeSelect
                    value={range}
                    onChange={setRange}
                />
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

            {loading && (
                <div className="du-loader-wrapper">
                    <div className="du-loader" />
                </div>
            )}

            {error && <div className="du-error">{error}</div>}

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
                        limit={summary.totalTokensUsed > 0 ? Math.round(summary.totalTokensUsed / (summary.tokenUsagePercent / 100)) : 0}
                        percent={summary.tokenUsagePercent}
                    />

                    <SummaryRow
                        icon={AiSmsSideBarIcon}
                        label="Sms used"
                        used={summary.totalSmsUsed}
                        limit={summary.totalSmsUsed > 0 ? Math.round(summary.totalSmsUsed / (summary.smsUsagePercent / 100)) : 0}
                        percent={summary.smsUsagePercent}
                    />

                </div>
            )}

        </div>
    );
};

const SummaryRow = ({ icon, label, used, limit, percent }) => {

    const safePercent = percent > 100 ? 100 : percent;

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

                    <div className="du-percent">
                        {percent}%
                    </div>
                </div>

                <div className="du-progress-bar">
                    <div
                        className="du-progress-fill"
                        style={{ width: `${safePercent}%` }}
                    />
                </div>

            </div>
        </div>
    );
};

export default DetailedUsage;