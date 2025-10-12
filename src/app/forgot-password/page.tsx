import PasswordReset from "./passwordReset";

interface Props {
  params: {
    userType: "tasker" | "runner";
    userId: string
  };
}

export default function Page({ params }: Props) {
  const { userType, userId } = params;

  return <PasswordReset userType={userType} userId={userId} />;
}
