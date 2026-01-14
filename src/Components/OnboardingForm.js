import React, { useState } from "react";
import "../Styles/OnboardingForm.css";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { IoMdInformationCircleOutline } from "react-icons/io";
import { GoPlus } from "react-icons/go";

const OnboardingForm = ({ onClose }) => {
    const MAX_CHARS = 150;
    const [providerName, setProviderName] = useState('');
    const [rosteringManagers, setRosteringManagers] = useState([{ email: "", phone: "" }]);
    const [shortlistCriteria, setShortlistCriteria] = useState("");
    const [clientSmsTemplate,setClientSmsTemplate]=useState('');
    const [staffSmsTemplate,setStaffSmsTemplate]=useState('');
    const [overtimeCriteria, setOvertimeCriteria] = useState("");
    const [days, setDays] = useState('');
    const addMoreEmails = () => {
        setRosteringManagers([
            ...rosteringManagers,
            { email: "", phone: "" }
        ]);
    };

    const handleManagerChange = (index, field, value) => {
        const updated = [...rosteringManagers];
        updated[index][field] = value;
        setRosteringManagers(updated);
    };

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
                        <input
                            type="text"
                            placeholder="Provider Name"
                            value={providerName}
                            onChange={(e) => setProviderName(e.target.value)}
                        />
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
                {rosteringManagers.map((manager, index) => (
                    <div className="onboarding-row" key={index}>
                        <div className="onboarding-field">
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                                <label className="roster-label">
                                    Rostering Manager Email <sup style={{ color: '#C14B40' }}>*</sup>
                                </label>
                            </div>
                            <input
                                type="text"
                                placeholder="Rostering Manager Email"
                                value={manager.email}
                                onChange={(e) =>
                                    handleManagerChange(index, "email", e.target.value)
                                }
                            />
                        </div>

                        <div className="onboarding-field">
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                                <label className="roster-label">
                                    Rostering Manager Phone number <sup style={{ color: '#C14B40' }}>*</sup>
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <div className="countryCode">+61</div>
                                <input
                                    type="text"
                                    placeholder="Rostering Manager Phone no."
                                    value={manager.phone}
                                    onChange={(e) =>
                                        handleManagerChange(index, "phone", e.target.value)
                                    }
                                    style={{ width: '92%' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="addEmail" onClick={addMoreEmails}>
                    <GoPlus color="#6c4cdc" size={20} />{" "} Add More Emails
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
                        <label>Client SMS Template</label>
                        {/* <Tippy
                            content={'Client SMS Template'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy> */}
                    </div>
                    <textarea
                        maxLength={MAX_CHARS}
                        value={clientSmsTemplate}
                        onChange={(e) => setClientSmsTemplate(e.target.value)}
                        placeholder="Describe client sms template"
                    />

                    <span
                        className={`onboarding-count ${MAX_CHARS - clientSmsTemplate.length < 20 ? "danger" : ""
                            }`}
                    >
                        {MAX_CHARS - clientSmsTemplate.length} characters left
                    </span>

                </div>
                <div className="onboarding-field">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <label>Staff SMS Template</label>
                        {/* <Tippy
                            content={'Staff SMS Template'}
                            trigger="mouseenter focus click"
                            interactive={true}
                            placement="bottom"
                            theme="onboarding"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <IoMdInformationCircleOutline size={20} color="#8B8B8B" />
                            </div>
                        </Tippy> */}
                    </div>
                    <textarea
                        maxLength={MAX_CHARS}
                        value={staffSmsTemplate}
                        onChange={(e) => setStaffSmsTemplate(e.target.value)}
                        placeholder="Describe staff sms template "
                    />

                    <span
                        className={`onboarding-count ${MAX_CHARS - staffSmsTemplate.length < 20 ? "danger" : ""
                            }`}
                    >
                        {MAX_CHARS - staffSmsTemplate.length} characters left
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
