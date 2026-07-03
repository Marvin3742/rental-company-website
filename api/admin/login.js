import bcrypt from "bcryptjs";
import { withApi, HttpError } from "../../lib/server/http.js";
import { prisma } from "../../lib/server/prisma.js";
import { signAdminToken, setAuthCookie } from "../../lib/server/auth.js";

export default withApi({
  async POST(req, res) {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, "Email and password are required");

    const user = await prisma.adminUser.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });
    // Compare even when user is missing-ish to reduce timing signal.
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!ok) throw new HttpError(401, "Invalid email or password");

    setAuthCookie(res, signAdminToken({ sub: user.id, email: user.email }));
    return { ok: true, email: user.email };
  },
});
