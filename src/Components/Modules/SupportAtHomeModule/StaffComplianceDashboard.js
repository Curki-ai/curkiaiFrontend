import React, { useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import "../../../Styles/StaffComplianceDashboard.css";
import Report from "../RosteringModule/Report"; // import the insights
import StaffInsights from "./StaffInsights";
import StaffCompliance from '../../../Images/StaffCompliance.jpeg';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const StaffComplianceDashboard = () => {
  const chartRef = useRef(null);

  const labels = [
    "10:30 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
  ];

  const dataValues = [3000, 4500, 3500, 6000, 7546, 8000, 7000];

  const data = {
    labels,
    datasets: [
      {
        label: "API Calls",
        data: dataValues,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(108, 99, 255, 0.2)");
          gradient.addColorStop(1, "rgba(108, 99, 255, 0)");
          return gradient;
        },
        borderColor: "#6C63FF",
        borderWidth: 3,
        pointBackgroundColor: "#6C63FF",
        pointBorderColor: "#fff",
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "#FF4D4D",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} API Calls`,
        },
      },
    },
    scales: {
      x: {
        grid: { drawBorder: false, color: "#f0f0f0" },
      },
      y: {
        grid: { drawBorder: false, color: "#f0f0f0" },
        ticks: { beginAtZero: true },
      },
    },
  };

  return (
    <div className="compliance-dashboard">
      {/* Top Summary Cards */}
      {/* <div className="summary-cards">
        <div className="card orange">
          <span className="icon">📂</span>
          <div>
            <p className="card-title">staff workers</p>
            <h3>3</h3>
          </div>
        </div>
        <div className="card purple">
          <span className="icon">🔄</span>
          <div>
            <p className="card-title">rostering managers</p>
            <h3>3456</h3>
          </div>
        </div>
        <div className="card blue">
          <span className="icon">👤</span>
          <div>
            <p className="card-title">clients</p>
            <h3>3</h3>
          </div>
        </div>
      </div> */}

      {/* Chart */}
      <div className="chart-container">
        {/* <Line ref={chartRef} data={data} options={options} /> */}
        <img src={StaffCompliance} alt='Staff Compliance' style={{ width: '100%' }} />
        <div className="compliance-report">
          <h2>Staff Compliance Report (Mar–Aug 2025)</h2>

          <h3>Overview</h3>
          <p>
            Your incidents line chart shows <b>10 → 18 → 17 → 14 → 14 → 19</b> across
            the last six completed months, peaking in <b>Aug 2025 (19)</b> after a
            mid-winter plateau. Overall trend is moderate volatility with an
            end-of-period uptick that warrants targeted prevention.
          </p>

          <h3>SIRS Events — Summary</h3>
          <ul>
            <li><b>Falls with injury (P2): 32</b> — clusters in Apr–May; mechanical aids and environment reviews advised.</li>
            <li><b>Medication errors (P2): 18</b> — mainly late rounds and missed doses on PM shifts.</li>
            <li><b>Behaviours of concern/aggression (P1 where serious): 9</b> — triggered by sundowning; de-escalation refreshers recommended.</li>
            <li><b>Unexplained injury (P1): 4</b> — all escalated and documented; ongoing investigation logs complete.</li>
            <li><b>Missing/absconding (P1): 2</b> — both resolved within 2 hours; sign-out protocols reinforced.</li>
          </ul>

          <h3>Incident Highlights</h3>
          <ul>
            <li><b>April spike (18)</b> driven by a run of falls during wet weather and footwear non-compliance.</li>
            <li><b>June–July stabilization (14 & 14)</b> after manual-handling refreshers and bay-by-bay rounding.</li>
            <li><b>August rise (19)</b> tied to three new high-acuity admissions and two medication-chart transitions.</li>
          </ul>

          <h3>Staff Compliance Status</h3>
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Status</th>
                <th>Missing / Expiry</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Amelia Singh</td><td>RN</td><td><b>Compliant</b></td><td>All current</td></tr>
              <tr><td>Liam Chen</td><td>EN</td><td><b>Compliant</b></td><td>FA/CPR due <b>Nov-2025</b></td></tr>
              <tr><td>Grace Patel</td><td>PCA</td><td><b>Compliant</b></td><td>Vax booster booked</td></tr>
              <tr><td>Noah Williams</td><td>PCA</td><td><b>At Risk</b></td><td><b>MH expired Aug-2025</b></td></tr>
              <tr><td>Sofia Brown</td><td>RN</td><td><b>Compliant</b></td><td>Med recert due <b>Oct-2025</b></td></tr>
              <tr><td>Oliver Davis</td><td>PCA</td><td><b>At Risk</b></td><td><b>NWC renewal due Sep-2025</b></td></tr>
              <tr><td>Mia Thompson</td><td>EN</td><td><b>Compliant</b></td><td>IC refresh due <b>Dec-2025</b></td></tr>
              <tr><td>Aarav Kumar</td><td>PCA</td><td><b>At Risk</b></td><td><b>FA/CPR expired Jul-2025</b></td></tr>
            </tbody>
          </table>

          <h3>Actions (Next 30 Days)</h3>
          <ul>
            <li>Target <b>falls hot-zones</b> (Apr–May rooms) with footwear checks & bed/chair-alarm audits.</li>
            <li>Close <b>three compliance gaps</b> (Noah—MH; Oliver—NWC; Aarav—FA/CPR) and auto-block high-risk rostering until cleared.</li>
            <li>Add <b>med-round double-sign</b> during chart transitions and coach PM shift on time-in-rounds.</li>
            <li>Pre-admission huddles for new high-acuity residents to prevent August-type spikes.</li>
          </ul>
        </div>
      </div>

      {/* Scrollable Insights Section */}
      {/* <div className="insights-scroll">
        <StaffInsights/>
      </div> */}
    </div>
  );
};

export default StaffComplianceDashboard;
