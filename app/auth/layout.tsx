

export const metadata = {
  title: 'Hazar Home - Giriş',
  description: 'Hazar Home authentication system',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-wrapper">
      {children}
    </div>
  )
}
