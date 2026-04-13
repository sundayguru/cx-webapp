import { useUser } from "~/utils/useUser";


export default function DashboardPage() {
  const {user} = useUser()
  console.log("user", user)
  return (
    <div className='space-y-6 p-6'>
      <h2>Dashboard</h2>
    </div>
  );
}
