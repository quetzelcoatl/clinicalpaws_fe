const BASE_URL = "https://dev.clinicalpaws.com/api/signup";

/** Helper function: checks response, throws if !ok */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    // if no JSON is returned, data will remain undefined
  }
  if (!response.ok) {
    const message = data?.detail || data?.message || "Something went wrong";
    throw new Error(message);
  }
  return data;
}

const AuthService = {
  // 1) new_signup_email
  newSignupEmail: async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/new_signup_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
  },

  // 2) resend_otp
  resendOtp: async (email) => {
    const response = await fetch(`${BASE_URL}/otp/resend_otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // 3) verify_otp
  verifyOtp: async (email, otp, purpose = "signup") => {
    const response = await fetch(`${BASE_URL}/otp/verify_otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, purpose }),
    });
    return handleResponse(response);
  },

  // 4) verify_password
  verifyPassword: async (email, password) => {
    const response = await fetch(`${BASE_URL}/verify_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  // 5) login_with_otp
  loginWithOtp: async (email) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // 6) get_access_token_from_refresh
  getAccessTokenFromRefresh: async (email, refreshToken) => {
    const response = await fetch(`${BASE_URL}/get_access_token_from_refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`, 
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // 7) fetch_user_details
  fetchUserDetails: async (accessToken) => {
    const response = await fetch(`${BASE_URL}/fetch_user_details`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: accessToken, // as required by your API
      },
    });
    return handleResponse(response);
  },

  // 8) reset_password_link
  resetPasswordLink: async (email) => {
    const response = await fetch(`${BASE_URL}/reset_password_link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // 9) set_password
  setPassword: async (email, reset_id, new_password) => {
    const response = await fetch(`${BASE_URL}/set_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, reset_id, new_password }),
    });
    return handleResponse(response);
  },
};

export default AuthService;
