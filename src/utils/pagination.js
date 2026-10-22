/**
 * Utility helper to standardize API pagination
 * Ensures safe integer bounds and uniform metadata response
 */
const getPaginationParams = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const formatPaginatedResponse = ({ data, totalCount, page, limit }) => {
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
};
