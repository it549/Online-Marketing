import { findUserByEmail } from "./auth.repository";
import { verifyPassword } from "./password";
import { createSessionToken } from "./session";

export class InvalidCredentialsError extends Error {
    constructor() {
        super("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        this.name = "InvalidCredentialsError";
    }
}

export async function login(email: string, password: string): Promise<{ token: string; email: string; role: string }> {
    const user = await findUserByEmail(email);

    if (!user || !user.isActive) {
        throw new InvalidCredentialsError();
    }

    const passwordMatches = verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
        throw new InvalidCredentialsError();
    }

    const token = createSessionToken({
        userId: user.id.toString(),
        email: user.email,
        role: user.role,
    });

    return { token, email: user.email, role: user.role };
}
