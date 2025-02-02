// frontend/src/services/AuthService.js
const BASE_URL = "https://clinicalpaws.com/api/signup";

import Cookies from "js-cookie"; // If you're using js-cookie

// Example function to set tokens in cookies
function storeTokensInCookie({ accessToken, refreshToken }) {
  // Example: store accessToken, refreshToken, lastRefreshedAt
  Cookies.set("accessToken", accessToken);
  Cookies.set("refreshToken", refreshToken);
  // Store the current time as a timestamp
  Cookies.set("lastRefreshedAt", Date.now().toString());
}

function getTokensFromCookie() {
  return {
    accessToken: Cookies.get("accessToken"),
    refreshToken: Cookies.get("refreshToken"),
    lastRefreshedAt: Cookies.get("lastRefreshedAt"), // as a string
  };
}


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
   *    Expects query parameters: name, email, password
   */
    newSignupEmail: async (name, email, password) => {
      const url = `${BASE_URL}/new_signup_email`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password
        }),
      });
      return handleResponse(response);
    },


  /**
   * 2) resend_otp
   *    Endpoint: POST /api/signup/otp/resend_otp
   *    Expects query parameter: email
   */
  resendOtp: async (email) => {
    const url = `${BASE_URL}/otp/resend_otp?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: "POST",
    });
    return handleResponse(response);
  },

  /**
   * 3) verify_otp
   *    Endpoint: POST /api/signup/otp/verify_otp
   *    Expects query parameters: email, otp, purpose (e.g., "signup" or "login")
   */
  verifyOtp: async (email, otp, purpose = "signup") => {
    const url = `${BASE_URL}/otp/verify_otp?email=${encodeURIComponent(
      email
    )}&otp=${encodeURIComponent(otp)}&purpose=${encodeURIComponent(purpose)}`;
    const response = await fetch(url, {
      method: "POST",
    });
    return handleResponse(response);
  },

  /**
   * 4) verify_password
   *    Endpoint: POST /api/signup/verify_password
   *    Expects query parameters: email, password
   */
    verifyPassword: async (email, password) => {
      const url = `${BASE_URL}/verify_password`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });
      return handleResponse(response);
    },


  /**
   * 5) login_with_otp
   *    Endpoint: POST /api/signup/login
   *    Expects query parameter: email
   */
  loginWithOtp: async (email) => {
    const url = `${BASE_URL}/login?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: "POST",
    });
    return handleResponse(response);
  },

  /**
   * 6) get_access_token_from_refresh
   *    Endpoint: POST /api/signup/get_access_token_from_refresh
   *    Expects query parameter: email
   *    The refresh token is sent via the Authorization header.
   */
  getAccessTokenFromRefresh: async (email, refreshToken) => {
    const url = `${BASE_URL}/get_access_token_from_refresh?email=${encodeURIComponent(
      email
    )}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    return handleResponse(response);
  },

  /**
   * 7) fetch_user_details
   *    Endpoint: GET /api/signup/fetch_user_details
   *    Requires a valid access token in the "token" header.
   */
  fetchUserDetails: async (accessToken) => {
    const url = `${BASE_URL}/fetch_user_details`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        token: accessToken, // as required by the backend
      },
    });
    return handleResponse(response);
  },

  /**
   * 8) reset_password_link
   *    Endpoint: POST /api/signup/reset_password_link
   *    Expects query parameter: email
   */
  resetPasswordLink: async (email) => {
    const url = `${BASE_URL}/reset_password_link?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: "POST",
    });
    return handleResponse(response);
  },

  /**
   * 9) set_password
   *    Endpoint: POST /api/signup/set_password
   *    Expects query parameters: email, reset_id, new_password
   */
  setPassword: async (email, reset_id, new_password) => {
    const url = `${BASE_URL}/set_password?email=${encodeURIComponent(email)}&reset_id=${encodeURIComponent(reset_id)}&new_password=${encodeURIComponent(new_password)}`;
    const response = await fetch(url, {
      method: "POST",
    });
    return handleResponse(response);
  },

  getAccessTokenFromRefresh: async (email, refreshToken) => {
    const url = `${BASE_URL}/get_access_token_from_refresh?email=${encodeURIComponent(
      email
    )}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    const data = await handleResponse(response);

    // Suppose your backend returns { access_token, refresh_token } in data
    const newAccessToken = data?.access_token;
    const newRefreshToken = data?.refresh_token;

    // Store the new tokens (if your backend returns them)
    if (newAccessToken && newRefreshToken) {
      storeTokensInCookie({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    }

    return data;
  }

};

export default AuthService;
