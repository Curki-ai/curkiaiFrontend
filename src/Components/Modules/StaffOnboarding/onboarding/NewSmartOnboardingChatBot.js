// SmartOnboardingChat.jsx
import React, { useState, useRef } from "react";
import { FiSend, FiX } from "react-icons/fi";
import axios from "axios";
import "../../../../Styles/general-styles/NewSmartOnboardingChatBot.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TlcUploadBox from "../../FinancialModule/Tlc/TlcUploadBox";

const SmartOnboardingChat = ({
    open,
    onClose,
    candidates = [],
    inputRef,
    user
}) => {
    const [message, setMessage] = useState("");
    const [step, setStep] = useState("IDLE");
    const [sending, setSending] = useState(false);
    const [chatMode, setChatMode] = useState("admin");
    const [screeningLoading, setScreeningLoading] = useState(false);

    // 👈 EK HI STATE FOR ALL FILES
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [screenedResults, setScreenedResults] = useState([]);
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [shortlistLoading, setShortlistLoading] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    console.log("candidates", candidates)
    const [chat, setChat] = useState([
        {
            type: "bot",
            text: "Hello! I'm Alex, your AI recruitment partner. How can I help you streamline the staff onboarding today?"
        }
    ]);

    const appendBot = (text) => {
        setChat((prev) => [...prev, { type: "bot", text }]);
    };

    const appendUser = (text) => {
        setChat((prev) => [...prev, { type: "user", text }]);
    };
    const sendMessage = async (customMsg) => {
        const finalMessage = customMsg || message;
        if (!finalMessage.trim() || sending) return;

        appendUser(finalMessage);
        setMessage("");
        setSending(true);

        try {
            const currentPhase = chatMode === "resume_screening" ? "resume_screening" : "general";
            const formattedCandidates = (candidates || []).map((item) => ({
                candidate_id: item.candidateId,
                candidate_name: item.candidateName,
                candidate_email: item.candidateEmail,
                candidate_resume_score: item.candidateResumeScore,
                candidate_skills: item.candidateSkills || [],
                resume_summary: item.resumeSummary,
                source_index: item.sourceIndex || 0
            }));

            const payload = {
                organisation_id: "abc123",
                message: finalMessage,
                workflow_phase: currentPhase,
                screened_candidates: currentPhase === "resume_screening" ? formattedCandidates : undefined,
                conversation_history: chat,
                admin_name: user?.displayName || "HR Admin"
            };
            console.log("Payload being sent:", payload);
            const res = await axios.post("https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/hr-chat", payload);
            console.log("res.data:", res.data);
            if (res.data?.ok) {
                const completedEvent = res.data.events?.find(
                    (item) => item.event === "staff_onboarding.hr_session_completed"
                );
                const reply = completedEvent?.payload?.reply || "No response received.";
                appendBot(reply);
            } else {
                appendBot("Something went wrong.");
            }
        } catch (error) {
            appendBot("Server error while connecting.");
        } finally {
            setSending(false);
        }
    };

    const handleAddCandidates = () => {
        setStep("UPLOAD");
        appendUser("I want to add new candidates.");
        appendBot("Great! Please upload Job Description and resume files.");
    };

    const handlePendingTests = () => {
        sendMessage("Who has not finished their screening test?");
    };

    const handleRequestDocs = () => {
        setMessage("I need to request documents from a candidate.");
    };

    // 👈 MODIFIED: API CALL WITH SINGLE FILE LIST
    const handleBulkScreening = async () => {
        console.log("handleBulkScreening started");

        if (uploadedFiles.length === 0) {
            alert("Please upload files");
            return;
        }

        try {
            setScreeningLoading(true);

            const formData = new FormData();
            formData.append("organisation_id", "abc123");

            // 👈 SAB FILES EK SAATH BHEJ RAHA HU
            uploadedFiles.forEach((file, index) => {
                if (index === 0) {
                    formData.append("jd_file", file);  // First file as JD
                } else {
                    formData.append("resume_files", file);  // Rest as resumes
                }
            });

            const res = await axios.post("https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/screen-bulk", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data?.ok) {
                const list = (res.data.candidates || []).map((item) => ({
                    ...item.screener,
                    index: item.index
                }));

                setScreenedResults(list);
                setSelectedCandidates(list.map((_, index) => index));
                setStep("RESULTS");
                appendBot(`Screening completed. ${list.length} candidates found.`);
            } else {
                appendBot("Screening failed.");
            }
        } catch (error) {
            console.log("screen-bulk error:", error.response?.data || error.message);
            appendBot("Bulk screening failed.");
        } finally {
            setScreeningLoading(false);
        }
    };

    const toggleCandidate = (index) => {
        setSelectedCandidates((prev) => {
            if (prev.includes(index)) {
                return prev.filter((item) => item !== index);
            }
            return [...prev, index];
        });
    };

    const handleShortlist = async () => {
        try {
            setShortlistLoading(true);
            const shortlisted = screenedResults.filter((_, index) => selectedCandidates.includes(index));
            const payload = {
                organisation_id: "abc123",
                admin_email: "tech2@careait.com",
                screened: screenedResults,
                selected_indices: selectedCandidates
            };

            await axios.post("https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/shortlist-screened", payload);
            appendBot(`${shortlisted.length} candidates shortlisted successfully.`);
            setStep("IDLE");
        } catch (error) {
            appendBot("Shortlisting failed.");
        }
        finally {
            setShortlistLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="soc_overlay">
            <div className="soc_box">
                <div className="soc_header">
                    <div>
                        <h3 className="soc_title">AI Alex</h3>
                        <p className="soc_subtitle">Smart Onboarding Assistant</p>
                    </div>
                    <button className="soc_close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="soc_body">
                    {chat.map((item, index) => (
                        <div key={index} className={item.type === "bot" ? "soc_msg soc_bot" : "soc_msg soc_user"}>
                            {item.type === "bot" ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ inline, children }) {
                                            return inline ? (
                                                <span className="soc_inline_text">{children}</span>
                                            ) : (
                                                <pre className="soc_pretty_code">{children}</pre>
                                            );
                                        }
                                    }}
                                >
                                    {item.text}
                                </ReactMarkdown>
                            ) : (
                                item.text
                            )}
                        </div>
                    ))}
                    {sending && (
                        <div className="soc_msg soc_bot soc_typing">
                            <div className="soc_loader">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    {step === "RESULTS" && (
                        <div className="soc_results_wrap">
                            {screenedResults.map((item, index) => (
                                <div
                                    key={index}
                                    className={`soc_card ${selectedCandidates.includes(index) ? "soc_card_active" : ""
                                        }`}
                                    onClick={() => toggleCandidate(index)}
                                >
                                    <div className="soc_card_top">
                                        <label className="soc_check_wrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedCandidates.includes(index)}
                                                onChange={() => toggleCandidate(index)}
                                            />
                                            <span>{item.candidate_name}</span>
                                        </label>
                                        <strong>{item.candidate_resume_score}</strong>
                                    </div>
                                    <div className="soc_card_content">
                                        <p className={`soc_card_desc ${expandedIndex === index ? "expanded" : ""}`}>
                                            {item.resume_summary}
                                        </p>

                                        {item.resume_summary?.length > 120 && (
                                            <button
                                                className="soc_read_more"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedIndex(expandedIndex === index ? null : index);
                                                }}
                                            >
                                                {expandedIndex === index ? "Read Less" : "Read More"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                className="soc_primary_btn soc_full_btn"
                                onClick={handleShortlist}
                                disabled={shortlistLoading || selectedCandidates.length === 0}
                            >
                                {shortlistLoading ? (
                                    <>
                                        <div className="soc_loader soc_loader_btn">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                        Shortlisting...
                                    </>
                                ) : (
                                    `Proceed with ${selectedCandidates.length} Selected`
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="soc_footer">
                    <div className="soc_tabs">
                        <button
                            className={chatMode === "general" ? "soc_tab_btn soc_tab_active" : "soc_tab_btn"}
                            onClick={() => {
                                setChatMode("general");
                                setStep("IDLE");
                            }}
                        >
                            General
                        </button>
                        <button
                            className={chatMode === "resume_screening" ? "soc_tab_btn soc_tab_active" : "soc_tab_btn"}
                            onClick={() => {
                                setChatMode("resume_screening");
                                setStep("IDLE");
                            }}
                        >
                            Resume Screening
                        </button>
                    </div>

                    {chatMode === "resume_screening" && step === "IDLE" && (
                        <div className="soc_suggestion_row">
                            <button className="soc_chip soc_chip_primary" onClick={handleAddCandidates}>
                                + ADD CANDIDATES
                            </button>
                            <button className="soc_chip" onClick={handleRequestDocs}>
                                REQUEST DOCS
                            </button>
                            <button className="soc_chip" onClick={handlePendingTests}>
                                PENDING TESTS
                            </button>
                        </div>
                    )}

                    {step === "IDLE" && (
                        <div className="soc_input_wrap">
                            <textarea
                                ref={inputRef}
                                value={message}
                                rows={1}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = e.target.scrollHeight + "px";
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder={
                                    chatMode === "general"
                                        ? "Ask anything..."
                                        : "Ask Alex about candidates or workflows..."
                                }
                                className="soc_textarea"
                            />
                            <button className="soc_send" onClick={() => sendMessage()} disabled={sending}>
                                <FiSend />
                            </button>
                        </div>
                    )}

                    {/* 👈 UPLOAD SECTION WITH TLC UPLOAD BOX */}
                    {step === "UPLOAD" && (
                        <div className="soc_upload_wrapper">
                            <TlcUploadBox
                                id="candidate-upload"
                                title="Upload Job Description & Resumes"
                                subtitle="First file = Job Description, Rest = Resumes"
                                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                                files={uploadedFiles}
                                setFiles={setUploadedFiles}
                                multiple={true}
                            />

                            <div className="soc_upload_btns">
                                <button
                                    className="soc_primary_btn"
                                    onClick={handleBulkScreening}
                                    disabled={screeningLoading || uploadedFiles.length === 0}
                                >
                                    {screeningLoading ? (
                                        <>
                                            <div className="soc_loader soc_loader_btn">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                            Processing...
                                        </>
                                    ) : (
                                        "🚀 Start Screening"
                                    )}
                                </button>

                                <button
                                    className="soc_cancel_btn"
                                    onClick={() => {
                                        setStep("IDLE");
                                        setUploadedFiles([]);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartOnboardingChat;