// frontend/src/services/AuthService.js

// Points to your backend’s FastAPI routes.
// Adjust if your API is located elsewhere or uses a different path.
const BASE_URL = "http://127.0.0.1:8000/api/signup";

/**
 * handleResponse:
 * A helper function to parse the JSON from the response,
 * and throw an error if response.ok is false.
 */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    // If no JSON is returned, data remains undefined
  }

  if (!response.ok) {
    // The API might return an error message in data.detail or data.message
    const message = data?.detail || data?.message || "Something went wrong";
    throw new Error(message);
  }
  return data; // { data: ..., message: ... }
}

const AuthService = {
  /**
   * 1) new_signup_email
   *    Endpoint: POST /api/signup/new_signup_email
   *    Body: { name, email, password }
   */
  newSignupEmail: async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/new_signup_email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
  },

  /**
   * 2) resend_otp
   *    Endpoint: POST /api/signup/otp/resend_otp
   *    Body: { email }
   */
  resendOtp: async (email) => {
    const response = await fetch(`${BASE_URL}/otp/resend_otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  /**
   * 3) verify_otp
   *    Endpoint: POST /api/signup/otp/verify_otp
   *    Body: { email, otp, purpose? }
   *    purpose can be "signup" or "login". Default "signup".
   */
  verifyOtp: async (email, otp, purpose = "signup") => {
    const response = await fetch(`${BASE_URL}/otp/verify_otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, purpose }),
    });
    return handleResponse(response);
  },

  /**
   * 4) verify_password
   *    Endpoint: POST /api/signup/verify_password
   *    Body: { email, password }
   *    Returns access & refresh tokens if password is correct.
   */
  verifyPassword: async (email, password) => {
    const response = await fetch(`${BASE_URL}/verify_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  /**
   * 5) login_with_otp
   *    Endpoint: POST /api/signup/login
   *    Body: { email }
   *    Requests an OTP to be sent for a user-based login flow.
   */
  loginWithOtp: async (email) => {
    const response = await fetch(
        `${BASE_URL}/login?email=${encodeURIComponent(email)}`,
        {
            method: "POST",
        }
    );
    return handleResponse(response);
  },


  /**
   * 6) get_access_token_from_refresh
   *    Endpoint: POST /api/signup/get_access_token_from_refresh
   *    Body: { email }
   *    Refresh token must also be in the header.
   */
  getAccessTokenFromRefresh: async (email, refreshToken) => {
    const response = await fetch(`${BASE_URL}/get_access_token_from_refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Typically "Authorization: Bearer <refresh-token>"
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  /**
   * 7) fetch_user_details
   *    Endpoint: GET /api/signup/fetch_user_details
   *    Requires a valid access token in the "token" header.
   */
  fetchUserDetails: async (accessToken) => {
    const response = await fetch(`${BASE_URL}/fetch_user_details`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: accessToken, // as required by the backend
      },
    });
    return handleResponse(response);
  },

  /**
   * 8) reset_password_link
   *    Endpoint: POST /api/signup/reset_password_link
   *    Body: { email }
   */
  resetPasswordLink: async (email) => {
    const response = await fetch(`${BASE_URL}/reset_password_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  /**
   * 9) set_password
   *    Endpoint: POST /api/signup/set_password
   *    Body: { email, reset_id, new_password }
   */
  setPassword: async (email, reset_id, new_password) => {
    const response = await fetch(`${BASE_URL}/set_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, reset_id, new_password }),
    });
    return handleResponse(response);
  },
};

export default AuthService;
