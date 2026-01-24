const flattenObject = (obj, parentKey = "", result = {}) => {
  if (!obj || typeof obj !== "object") return result;

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;

    if (value === null || value === undefined) {
      result[newKey] = "";
      return;
    }

    if (Array.isArray(value)) {
      result[newKey] = value.join(", ");
      return;
    }

    if (typeof value === "object") {
      flattenObject(value, newKey, result);
      return;
    }

    result[newKey] = value;
  });

  return result;
};

/**
 * ✅ ONLY ONE START MAPPER
 * It will pick the FIRST object that contains real fields.
 */
const getStartMapper = (mappings) => {
  if (!mappings) return {};

  let parsed = mappings;

  // parse JSON string
  if (typeof mappings === "string") {
    try {
      parsed = JSON.parse(mappings);
    } catch (e) {
      console.error("[MAPPER] JSON parse failed", e);
      return {};
    }
  }

  // ✅ take top mapper (wrapper)
  const root = parsed?.mapper ?? parsed;

  if (!root || typeof root !== "object") return {};

  /**
   * Possible shapes:
   * 1) root.mapper = { PARTICIPANT_NAME: {...}, ... } ✅ (your screenshot)
   * 2) root.field_mappings = {...}
   * 3) root.mapper.field_mappings = {...}
   * 4) root.mapper.mapper = {...}
   */

  // ✅ screenshot case: mapper: { mapper: { PARTICIPANT_NAME... } }
  if (root?.mapper && typeof root.mapper === "object") {
    // if it looks like actual fields object
    const inner = root.mapper;

    // if inside has field_mappings, use that
    if (inner?.field_mappings && typeof inner.field_mappings === "object") {
      return inner.field_mappings;
    }

    // else return inner directly
    return inner;
  }

  // ✅ field_mappings direct
  if (root?.field_mappings && typeof root.field_mappings === "object") {
    return root.field_mappings;
  }

  // fallback
  return root;
};

export const mapperToRows = (mappings) => {
  const startMapper = getStartMapper(mappings);

//   console.log("[MAPPER] startMapper:", startMapper);

  if (!startMapper || typeof startMapper !== "object") return [];

  const rows = Object.entries(startMapper).map(([fieldKey, fieldValue], idx) => {
    const sourcePattern = fieldValue?.source_pattern || fieldValue?.source || "";

    return {
      id: idx + 1,

      // ✅ column 1
      template_field: fieldKey,

      // ✅ column 2
      source: Array.isArray(sourcePattern)
        ? sourcePattern.join(", ")
        : String(sourcePattern || ""),

      // ✅ column 3
      type: fieldValue?.type || "text",

      // ✅ column 4
      required: !!fieldValue?.required,

      // (optional future use)
      validation: fieldValue?.validation || {},
      transform: fieldValue?.transform || "",
    };
  });

//   console.log("[MAPPER] grouped rows:", rows);

  return rows;
};

