import { withApi } from "../http.js";
import { clearAuthCookie } from "../auth.js";

export default withApi({
  async POST(req, res) {
    clearAuthCookie(res);
    return { ok: true };
  },
});
