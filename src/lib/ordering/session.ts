import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'p1nto_dining_session'

export async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export async function setSessionToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12 // 12 hours
  })
}

export async function clearSessionToken() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
