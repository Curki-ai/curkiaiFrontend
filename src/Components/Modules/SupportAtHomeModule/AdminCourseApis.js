import axios from "axios";

const BASE_URL = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

// ✅ Create Module
export const createModuleApi = async (title, AdminEmail) => {
    const res = await axios.post(`${BASE_URL}/createModule`, { title, AdminEmail });
    // console.log(`createModuleApi response:`, res);
    return res.data; // axios keeps response in res.data
};

// ✅ Create Lecture (with file upload)
export const createLectureApi = async (moduleId, title, type, file) => {
    const formData = new FormData();
    formData.append("moduleId", moduleId);
    formData.append("title", title);
    formData.append("type", type);
    if (file) {
        formData.append("file", file); // backend expects field name "files"
    }

    const res = await axios.post(`${BASE_URL}/createLecture`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

// ✅ Update Lecture
export const updateLectureApi = async (moduleId, lectureId, title, type, file) => {
    if (file) {
        const formData = new FormData();
        formData.append("moduleId", moduleId);
        formData.append("lectureId", lectureId);
        formData.append("title", title);
        formData.append("type", type);
        formData.append("file", file);

        const res = await axios.put(`${BASE_URL}/updateLecture`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } else {
        const res = await axios.put(`${BASE_URL}/updateLecture`, {
            moduleId,
            lectureId,
            title,
            type,
        });
        return res.data;
    }
};

export const getAllModulesApi = async (AdminEmail) => {
    const res = await axios.get(`${BASE_URL}/getAllModules/${AdminEmail}`);
    // console.log("getAllModulesApi response:", res);
    return res.data.modules; // backend returns { modules: [...] }
};

export const editModuleApi = async (id, title) => {
    try {
        const res = await axios.put(`${BASE_URL}/updateModule`, { id, title });
        // console.log("editModuleApi response:", res);
        return res.data; // updated module
    } catch (err) {
        console.error("❌ Error in editModuleApi:", err);
        throw err;
    }
};

export const deleteModuleApi = async (id) => {
    console.log('deleteModuleApi called with id:', id);
    try {
        const res = await axios.delete(`${BASE_URL}/deleteModule`, {
            headers: { "Content-Type": "application/json" },
            data: { id }, // 👈 must wrap id inside data
        });
        // console.log("deleteModuleApi response:", res);
        return res.data; // { message: "Module deleted successfully" }
    } catch (err) {
        console.error("❌ Error in deleteModuleApi:", err);
        throw err;
    }
};

