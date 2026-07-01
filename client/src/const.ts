export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Redirect to the login page.
 * Simple credentials auth — no OAuth.
 */
export const getLoginUrl = () => `/login`;
