import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/budget/summary")
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data) return <p>Loading budget...</p>;

  return (
    <div>
      <h2>Budget Summary</h2>
      <p>Income: ₪{data.income}</p>
      <p>Expenses: ₪{data.expenses}</p>
      <p>Balance: ₪{data.balance}</p>
    </div>
  );
}

export default Dashboard;
