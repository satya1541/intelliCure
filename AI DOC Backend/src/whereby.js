const axios = require("axios");
const { WHEREBY_API_BASE_URL, WHEREBY_API_KEY } = require("./config");

async function createWherebyRoom({ wardId, doctorId }) {
  if (!WHEREBY_API_KEY) {
    throw new Error("WHEREBY_API_KEY not set");
  }

  const endDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const roomNamePrefix = wardId ? `ward-${wardId}` : "hospital-vc";

  const response = await axios.post(
    `${WHEREBY_API_BASE_URL}/meetings`,
    {
      endDate,
      roomNamePrefix,
    },
    {
      headers: {
        Authorization: `Bearer ${WHEREBY_API_KEY}`,
      },
    }
  );

  return {
    meetingId: response.data?.meetingId,
    roomUrl: response.data?.roomUrl,
    hostRoomUrl: response.data?.hostRoomUrl,
    wardId,
    doctorId,
  };
}

module.exports = { createWherebyRoom };
