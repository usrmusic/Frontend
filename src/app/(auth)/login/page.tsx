"use client";
import { useLogin } from "@/src/api/authApi";
import Button from "@/src/components/Button";
import Input from "@/src/components/Input";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      loginMutation.mutate(
        {
          email: values.email,
          password: values.password,
        },
        {
          onSuccess: () => router.push("/dashboard"),
        },
      );
    },
  });
  const loginMutation = useLogin();

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        className="max-w-sm w-full mx-auto space-y-6 my-16"
        onSubmit={formik.handleSubmit}
      >
        <div className="text-2xl font-semibold text-center mb-6">Login</div>
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <Button
          className="w-full"
          type="primary"
          htmlType="submit"
          loading={loginMutation.isPending}
          disabled={loginMutation.isPending}
        >
          Login
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
