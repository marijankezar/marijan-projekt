import StundenbuchungenList from "app/components/StundenbuchungenList";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Stundenbuchungen</h1>
      <StundenbuchungenList />
    </div>
  );
}
