import { useState } from "react";

type Customer = {
  name: string;
  address: string;
  mail: string;
};

export default function AddCustomer() {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    address: "",
    mail: "",
  });
  const customerProps: Array<keyof Customer> = ["name", "address", "mail"];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/customers", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(customer),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add customer on server.");
      }
      setCustomer({ name: "", address: "", mail: "" });
    } catch (error) {
      console.error("Error sending customer data:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="m-4 p-4">
        {customerProps.map((e) => (
          <div key={e}>
            <label htmlFor={e}>{e}</label>
            <input
              type="text"
              id={e}
              className="p-4"
              placeholder={e}
              value={customer[e]}
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  [e]: event.target.value,
                })
              }
            />
          </div>
        ))}

        <button
          type="submit"
          className="border-2 rounded px-3 py-2 cursor-pointer"
        >
          Kunde hinzufügen
        </button>
      </form>
    </div>
  );
}
