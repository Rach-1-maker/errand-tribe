import PasswordReset from "./passwordReset";

interface PasswordProps {
  params: {
    userType: "tasker" | "runner";
    userId: string
  };
}

export default function Page({ params }: PasswordProps) {
  const { userType, userId } = params;

  return <PasswordReset userType={userType} userId={userId} />;
}
