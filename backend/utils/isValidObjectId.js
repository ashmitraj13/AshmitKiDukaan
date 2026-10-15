// A MongoDB ObjectId is exactly 24 hex characters
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

export default isValidObjectId;
