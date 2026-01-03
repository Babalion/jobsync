import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import SigninForm from "@/components/auth/SigninForm";
import { TranslatedText } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Signin",
};

export default function Signin() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">
          <TranslatedText id="Login" />
        </CardTitle>
        <CardDescription>
          <TranslatedText id="Enter your email below to login to your account" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SigninForm />
        <div className="mt-4 text-center text-sm">
          <TranslatedText id="Don't have an account?" />{" "}
          <Link href="/signup" className="underline">
            <TranslatedText id="Sign up" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
