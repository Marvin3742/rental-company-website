import { withApi } from "../http.js";
import { requireAdmin } from "../auth.js";

export default withApi({
  async GET(req) {
    const admin = requireAdmin(req);
    return { email: admin.email };
  },
});
