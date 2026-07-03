import { withApi } from "../../lib/server/http.js";
import { clearAuthCookie } from "../../lib/server/auth.js";

export default withApi({
  async POST(req, res) {
    clearAuthCookie(res);
    return { ok: true };
  },
});
