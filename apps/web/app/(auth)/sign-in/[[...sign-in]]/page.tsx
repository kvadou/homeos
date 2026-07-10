import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-900 px-4">
      {/* Logo */}
      <Link href="/" className="mb-6 flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="HomeOS"
          width={48}
          height={48}
          className="rounded-lg"
        />
        <span className="font-heading text-2xl font-bold text-white">
          HomeOS <span className="text-teal-400">AI</span>
        </span>
      </Link>

      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            cardBox: "shadow-2xl",
            card: "rounded-xl",
            headerTitle: "font-semibold",
            formButtonPrimary:
              "bg-teal-500 hover:bg-teal-600 text-white",
            footer: "hidden",
          },
        }}
      />

      {/* Custom footer to replace hidden Clerk footer */}
      <p className="mt-4 text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-teal-400 hover:text-teal-300 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
