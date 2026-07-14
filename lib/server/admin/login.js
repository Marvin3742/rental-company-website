import bcrypt from "bcryptjs";
import { withApi, HttpError } from "../http.js";
import { prisma } from "../prisma.js";
import { signAdminToken, setAuthCookie } from "../auth.js";
import { rateLimit, clientIp } from "../rate-limit.js";

// Any well-formed bcrypt hash works here: it's compared against when the email
// doesn't match an account, so a missing user costs the same ~100ms as a wrong
// password (no timing signal for probing which email the admin uses). The
// result is discarded — `ok` also requires `user` to exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export default withApi({
  async POST(req, res) {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, "Email and password are required");

    const normalized = String(email).trim().toLowerCase();
    // Throttle brute force: per client IP, and per target account (so a
    // distributed guesser burning many IPs against one email still stalls).
    rateLimit(`login:ip:${clientIp(req)}`, { max: 8, windowMs: 15 * 60 * 1000 });
    rateLimit(`login:email:${normalized}`, { max: 20, windowMs: 60 * 60 * 1000 });

    const user = await prisma.adminUser.findUnique({ where: { email: normalized } });
    const ok = (await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)) && Boolean(user);
    if (!ok) throw new HttpError(401, "Invalid email or password");

    setAuthCookie(res, signAdminToken({ sub: user.id, email: user.email }));
    return { ok: true, email: user.email };
  },
});
