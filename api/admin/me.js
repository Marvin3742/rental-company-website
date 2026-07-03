import { withApi } from "../../lib/server/http.js";
import { requireAdmin } from "../../lib/server/auth.js";

export default withApi({
  async GET(req) {
    const admin = requireAdmin(req);
    return { email: admin.email };
  },
});
