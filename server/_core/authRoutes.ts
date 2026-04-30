import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { signSession } from "./jwtAuth";
import { createUser, getUserByOpenId } from "../db";

export function registerAuthRoutes(app: Express) {
  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};

    if (!email || !password || !name) {
      res.status(400).json({ error: "E-posta, şifre ve ad gereklidir" });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Geçerli bir e-posta adresi girin" });
      return;
    }

    try {
      const existing = await getUserByOpenId(email);
      if (existing) {
        res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await createUser({ email, name, passwordHash });

      const token = await signSession({ userId: user.id, email: user.email!, name: user.name ?? "" });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      console.error("[Auth] Register error:", error);
      res.status(500).json({ error: "Kayıt başarısız" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "E-posta ve şifre gereklidir" });
      return;
    }

    try {
      const user = await getUserByOpenId(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "E-posta veya şifre hatalı" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "E-posta veya şifre hatalı" });
        return;
      }

      const token = await signSession({ userId: user.id, email: user.email!, name: user.name ?? "" });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      res.status(500).json({ error: "Giriş başarısız", detail: String(error) });
    }
  });
}
