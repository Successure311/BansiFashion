// "APC" is a special colour option available for every quality. Instead of a
// colour number the user writes a free-text remark; it is stored in the same
// ColourNo column as "APC <remark>", so the sheet and Analysis logic is unchanged.
export const APC = "APC";

export const makeApcColour = (text) => `${APC} ${text.trim()}`;

export const isApcColour = (colour) => /^APC(\s|$)/i.test(String(colour || "").trim());

export const apcText = (colour) => String(colour || "").trim().replace(/^APC\s*/i, "");
