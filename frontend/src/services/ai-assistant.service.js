import axios from "axios";

// Adjust this URL path/port to match your exact backend setup
const API_URL = "http://localhost:3777/api";

export const aiAssistantService = {
  getAnswer: async (question, history = []) => {
    // 1. Retrieve the JWT token from where your AuthContext stores it (usually localStorage)
    const token = localStorage.getItem("token");

    // 2. Make the POST request with appropriate auth headers
    const response = await axios.post(
      `${API_URL}/ai-assistant/answer`,
      { question, history },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      },
    );

    // Axios wraps the backend JSON payload in its own .data property.
    // Your controller returns: { success: true, data: { answer: "..." } }
    // Returning response.data here passes that exact object to your JSX component.
    return response.data;
  },
};
