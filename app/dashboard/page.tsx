import StundenbuchungenList from "app/components/StundenbuchungenList";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Stundenbuchungen</h1>
      <StundenbuchungenList />
    </div>
  );
}
