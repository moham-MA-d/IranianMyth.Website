import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000"; // Your Flask API URL

export const fetchDiagramData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roots`);
    return response.data; // Assuming the API returns { nodes: [], links: [] }
  } catch (error) {
    console.error("Error fetching data:", error);
    return { nodes: [], links: [] };
  }
};
