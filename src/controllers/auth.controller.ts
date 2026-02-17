import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { logAction } from '../utils/auditLogger';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // 1. Validatsiya
  if (!username || !password) {
    return res.status(400).json({ message: "Login va parol kiritilishi shart!" });
  }

  try {
    // 2. Foydalanuvchini bazadan topish
    const userResult = await query('SELECT id, username, password, role FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Bunday foydalanuvchi mavjud emas!" });
    }

    const user = userResult.rows[0];

    // 3. Parolni solishtirish
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Login yoki parol xato!" });
    }

    // 4. JWT (Token) yaratish
    const payload = {
      id: user.id,
      role: user.role,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRE || '12h',
    } as jwt.SignOptions);

    // 5. Auditga yozish
    await logAction(user.id, 'LOGIN_SUCCESS', 'users', user.id, { ip: req.ip });

    // 6. Javob qaytarish
    res.status(200).json({
      message: "Tizimga muvaffaqiyatli kirildi!",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login xatosi:", error);
    res.status(500).json({ message: "Serverda kutilmagan xatolik yuz berdi." });
  }
};
