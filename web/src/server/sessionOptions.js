/** @type {import("iron-session").SessionOptions} */
export const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "development-only-32-char-secret-key!!",
  cookieName: "admin_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
};
