import { API_BASE as COUNT_API_BASE } from "../../../config/apiBase";

const incrementCareVoiceAnalysisCount = async (userEmail, buttonType, AiAnalysisCost, moduleName,tokenDeducted) => {
  try {
    if (!userEmail) return;

    const payload = { userEmail, buttonType, AiAnalysisCost, moduleName,tokenDeducted };

    const res = await fetch(`${COUNT_API_BASE}/carevoice-increment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    //Trigger popup when backend starts auto topup
    if (
      res.status === 403 &&
      data.message === "Auto topup initiated. Retry shortly."
    ) {
      window.dispatchEvent(new CustomEvent("AUTO_TOPUP_TRIGGER"));
    }

    return {
      status: res.status,
      message: data.message,
      data
    };

  } catch (error) {
    return {
      status: 500,
      message: error.message
    };
  }
};

export default incrementCareVoiceAnalysisCount;