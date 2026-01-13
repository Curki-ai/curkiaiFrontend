import React, { useState } from "react";
import "../Styles/OnboardingForm.css";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { IoMdInformationCircleOutline } from "react-icons/io";

const OnboardingForm = ({ onClose }) => {
    const MAX_CHARS = 150;
    const [shortlistCriteria, setShortlistCriteria] = useState("");
    const [overtimeCriteria, setOvertimeCriteria] = useState("");
    const [days, setDays] = useState('');
    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">

                <div style={{ display: 'flex', justifyContent: "space-between", alignItems: 'center', borderBottom: '1px solid #e6e6e6', paddingBottom: '24px', marginBottom: '24px' }}>
                    <div className="onboarding-titlesss">Rostering Settings</div>
                    <button className="onboarding-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="onboarding-row">
                    <div className="onboarding-field">
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                            <label>Provider Name</label>
                        </div>
                        <input type="text" placeholder="Provider Name" />
                    </div>

                    <div className="onboarding-field">
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                            <label>Show Unallocated Shifts For</label>
                            <Tippy
                                content={'Choose how many days from today unallocated shifts should be displayed.'}
                                trigger="mouseenter focus click"
                                interactive={true}
                                placement="bottom"
                                theme="onboarding"
                            >
                                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                                </div>
                            </Tippy>
                        </div>
                        <select
                            className="days-select"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                        >
                            <option value="" disabled>
                                Select Days
                            </option>
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="7">7 Days</option>
                        </select>

                    </div>
                </div>

                <div className="onboarding-field">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <label>Profile Shortlisting Criteria</label>
                        <Tippy
                            content={'Example: Prioritize worker with skills closly matching client needs; prefer within 30km'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy>
                    </div>
                    <textarea
                        maxLength={MAX_CHARS}
                        value={shortlistCriteria}
                        onChange={(e) => setShortlistCriteria(e.target.value)}
                        placeholder="Describe your profile shortlisting criteria in less than 150 characters"
                    />

                    <span
                        className={`onboarding-count ${MAX_CHARS - shortlistCriteria.length < 20 ? "danger" : ""
                            }`}
                    >
                        {MAX_CHARS - shortlistCriteria.length} characters left
                    </span>

                </div>

                <div className="onboarding-field">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <label>Overtime Elimination Criteria</label>
                        <Tippy
                            content={'Example: 76 hours in current fortnight or >10 hours on shift day'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy>
                    </div>
                    <textarea
                        maxLength={MAX_CHARS}
                        value={overtimeCriteria}
                        onChange={(e) => setOvertimeCriteria(e.target.value)}
                        placeholder="Describe your overtime elimination criteria in less than 150 characters "
                    />

                    <span
                        className={`onboarding-count ${MAX_CHARS - overtimeCriteria.length < 20 ? "danger" : ""
                            }`}
                    >
                        {MAX_CHARS - overtimeCriteria.length} characters left
                    </span>

                </div>

                <div className="onboarding-field">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <label>Exclude Roles From Shortlisting</label>
                        <Tippy
                            content={'Select the roles you want to exclude from the shortlisting process'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy>
                    </div>
                    <input placeholder="Search for roles you want to exclude" />
                </div>

                <div className="onboarding-toggle">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <span>Notify Client On Staff Shift Acceptance</span>
                        <Tippy
                            content={'Enable this to notify the client when a staff member accepts a shift'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy>
                    </div>
                    <label className="toggle-switches">
                        <input type="checkbox" />
                        <span className="sliderss"></span>
                    </label>
                </div>

                <div className="onboarding-toggle">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <span>Reminder SMS to staffs</span>
                        <Tippy
                            content={'Enable to send reminder SMS messages to staff every 4 hours untill the shift is acknowledged'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy>
                    </div>
                    <label className="toggle-switches">
                        <input type="checkbox" />
                        <span className="sliderss"></span>
                    </label>
                </div>

                <div className="onboarding-toggle">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <span>
                            Require Rostering Manager Approval After Staff Accept A Shift
                        </span>
                        <Tippy
                            content={'Enable this to require rostering manager approval for the staff shift acceptance message sent in the chat'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy>
                    </div>
                    <label className="toggle-switches">
                        <input type="checkbox" />
                        <span className="sliderss"></span>
                    </label>
                </div>

                <div className="onboarding-footer">
                    <button className="onboarding-save-btn">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingForm;
