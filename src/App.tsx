import { useEffect, useState } from "react";
import "./App.css";
import html2pdf from "html2pdf.js";
import { generateInvoiceHtml } from "./invoiceTemplate";

interface Data {
  customerName: string;
  customerStreet: string;
  customerZip: string;
  customerCity: string;
  customerCountry: string;
  invoiceDate: string;
  dueDate: string;
  invoiceNumber: number;
  // servicePeriodStart: string;
  // servicePeriodEnd: string;
  positions: InvoicePosition[];
}

interface InvoicePosition {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const LOCAL_STORAGE_KEY = 'invoiceNr'; 
const DEFAULT_INVOICE_NUMBER = 666; // Deine gewünschte Startnummer

function App() {
  const [data, setData] = useState<Data>(() => {
    const initialData: Data = {
      customerName: "",
      customerStreet: "",
      customerZip: "",
      customerCity: "",
      customerCountry: "",
      invoiceDate: "",
      dueDate: "",
      positions: [
        { id: 1, description: "", quantity: 0, unitPrice: 0, total: 0 }
      ],
      invoiceNumber: DEFAULT_INVOICE_NUMBER // Ein vorläufiger Standard, falls nichts im localStorage ist
    };
    // Rechnungsnummer aus localStorage laden
    const storedNumberString = localStorage.getItem(LOCAL_STORAGE_KEY);
    let initialNumericInvoiceNumber: number;

    if (storedNumberString) {
      const parsedNumber = parseInt(storedNumberString, 10);
      if (isNaN(parsedNumber) || parsedNumber === 666) {
        alert(`Ungültige Rechnungsnummer im localStorage. Siehe in letzter Rechnung nach und setze invoiceNr manuell.`);
        initialNumericInvoiceNumber = DEFAULT_INVOICE_NUMBER;
      } else {
        initialNumericInvoiceNumber = parsedNumber;
      }
    } else {
      alert(`Keine Rechnungsnummer im localStorage gefunden. Siehe in letzter Rechnung nach und setze invoiceNr manuell.`);
      initialNumericInvoiceNumber = DEFAULT_INVOICE_NUMBER;
    }
    
    initialData.invoiceNumber = initialNumericInvoiceNumber; // Setze die geladene/initialisierte Nummer

    return initialData;

  });

  const companyInfo = {
    name: "Namaste Websites",
    owner: "Marian Nökel",
    street: "Schlierseestrasse 10",
    zip: "81541",
    city: "München",
    country: "Deutschland",
    phone: "015231432433",
    email: "noekel@namaste-websites.de",
    bankName: "N26 Bank",
    iban: "9999",
    bic: "9999",
    taxId: "9999",
    website: "www.namaste-websites.de",
  };
  //Datum
  useEffect(() => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 14);

    setData((prevData) => ({
      ...prevData, // Behalte alle anderen Daten (Kunde, Positionen) unverändert
      invoiceDate: today.toLocaleDateString("de-DE"),
      dueDate: dueDate.toLocaleDateString("de-DE"),
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem("invoiceNr", JSON.stringify(data.invoiceNumber));
  }, [data.invoiceNumber]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    generatePdf();
    setData((prevData) => ({
      ...prevData,
      invoiceNumber: prevData.invoiceNumber + 1,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const generatePdf = () => {
    const invoiceTemplateData = {
      ...data, // Contains customerName, customerStreet, etc., invoiceDate, dueDate, positions
      subtotal: subtotal,
      taxAmount: taxAmount,
      grandTotal: grandTotal,
      taxRate: TAX_RATE, // Pass the tax rate
      companyInfo: companyInfo, // Pass the entire companyInfo object
    };

    // **Call the external function to get the HTML content**
    const content = generateInvoiceHtml(invoiceTemplateData);

    const options = {
      margin: 10,
      filename: `rechnung_${data.invoiceNumber}_${data.invoiceDate}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(content).set(options).save();
  };

  const handlePositionChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target; // Extrahiere 'name' (z.B. "description", "quantity") und 'value' vom Input-Feld
    const newPositions = [...data.positions]; // Erstelle eine SHALLOW COPY des aktuellen 'positions'-Arrays

    // Behandle Zahlenfelder: Konvertiere den Wert zu einer Zahl (float) oder 0, falls ungültig
    const parsedValue =
      name === "quantity" || name === "unitPrice"
        ? parseFloat(value) || 0 // Versuche zu parsen, wenn ungültig (z.B. "abc"), setze 0
        : value; // Für 'description' bleibt es ein String

    // Aktualisiere das spezifische Feld der betroffenen Position
    // newPositions[index] ist die spezifische Position, die wir bearbeiten
    newPositions[index] = {
      ...newPositions[index], // Kopiere alle bestehenden Eigenschaften dieser Position
      [name]: parsedValue, // Überschreibe die Eigenschaft, deren 'name' übereinstimmt, mit dem neuen Wert
    };

    newPositions[index].total =
      newPositions[index].quantity * newPositions[index].unitPrice;

    setData((prevData) => ({
      ...prevData,
      positions: newPositions, // <-- Hier wird der State tatsächlich aktualisiert
    }));
  };

  const addPosition = () => {
    setData((prevData) => ({
      ...prevData, // Behalte alle anderen Daten im State
      positions: [
        ...prevData.positions, // Kopiere alle bestehenden Positionen
        {
          // Erstelle eine neue Position mit einer einzigartigen ID
          // Math.max holt die höchste ID der bestehenden Positionen, +1 für eine neue ID
          id: Math.max(...prevData.positions.map((p) => p.id), 0) + 1,
          description: "",
          quantity: 0,
          unitPrice: 0,
          total: 0,
        },
      ],
    }));
  };

  const removePosition = (idToRemove: number) => {
    // Verhindere das Entfernen der letzten Position (optional, aber sinnvoll)
    if (data.positions.length === 1) {
      alert("Es muss mindestens eine Position vorhanden sein.");
      return;
    }

    setData((prevData) => ({
      ...prevData, // Behalte alle anderen Daten im State
      positions: prevData.positions.filter((pos) => pos.id !== idToRemove), // Filtert die Position mit der passenden ID heraus
    }));
  };

  const subtotal = data.positions.reduce((sum, pos) => sum + pos.total, 0);
  const TAX_RATE = 0; //Einzelunternehmen unterhalb der Obergrenze
  const taxAmount = subtotal * TAX_RATE;
  const grandTotal = subtotal + taxAmount;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div className="min-h-screen bg-gray-100 p-4">
        <header className="py-6 bg-white shadow-md rounded-lg mb-6">
          <h1 className="text-3xl font-bold text-blue-700">
            The Mighty Invoice - Rechnungserstellung
          </h1>
        </header>
        <main>
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl"
          >
            {/* Kundeninformationen */}
            <section className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Kundeninformationen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label
                    htmlFor="customerName"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Kundennamen:
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    placeholder="Name"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                    value={data.customerName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-1">
                  <label
                    htmlFor="customerStreet"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Straße und Hausnummer:
                  </label>
                  <input
                    type="text"
                    id="customerStreet"
                    name="customerStreet"
                    placeholder="Strasse"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                    value={data.customerStreet}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-1">
                  <label
                    htmlFor="customerZip"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    PLZ:
                  </label>
                  <input
                    type="text"
                    id="customerZip"
                    name="customerZip"
                    placeholder="PLZ"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                    value={data.customerZip}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-1">
                  <label
                    htmlFor="customerCity"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Ort:
                  </label>
                  <input
                    type="text"
                    id="customerCity"
                    name="customerCity"
                    placeholder="Stadt"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                    value={data.customerCity}
                    onChange={handleChange}
                  />
                </div>
                <div className="">
                  <label
                    htmlFor="customerCountry"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Land:
                  </label>
                  <input
                    type="text"
                    id="customerCountry"
                    name="customerCountry"
                    placeholder="Land"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                    value={data.customerCountry}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* Rechnungsdetails */}
            <section className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Rechnungsdetails
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label
                    htmlFor="invoiceDate"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Rechnungsdatum:
                  </label>
                  <input
                    type="text"
                    id="invoiceDate"
                    name="invoiceDate"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                    value={data.invoiceDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-1">
                  <label
                    htmlFor="dueDate"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Fälligkeitsdatum:
                  </label>
                  <input
                    type="text"
                    id="dueDate"
                    name="dueDate"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                    value={data.dueDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* Leistungspositionen */}
            <section className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Leistungspositionen
              </h2>
              <div className="space-y-4">
                {data.positions.map((position, index) => (
                  <div
                    key={position.id}
                    className="p-4 border border-gray-300 rounded-lg bg-white shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="col-span-full">
                        <label
                          htmlFor={`description-${position.id}`}
                          className="block text-gray-700 text-sm font-bold mb-2"
                        >
                          Beschreibung:
                        </label>
                        <input
                          type="text"
                          id={`description-${position.id}`}
                          name="description"
                          placeholder="Service"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                          value={position.description}
                          onChange={(e) => handlePositionChange(index, e)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`quantity-${position.id}`}
                          className="block text-gray-700 text-sm font-bold mb-2"
                        >
                          Menge:
                        </label>
                        <input
                          type="number"
                          id={`quantity-${position.id}`}
                          name="quantity"
                          min="0"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                          value={position.quantity}
                          onChange={(e) => handlePositionChange(index, e)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`unitPrice-${position.id}`}
                          className="block text-gray-700 text-sm font-bold mb-2"
                        >
                          Einzelpreis (€):
                        </label>
                        <input
                          type="number"
                          id={`unitPrice-${position.id}`}
                          name="unitPrice"
                          min="0"
                          step="0.01"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                          value={position.unitPrice}
                          onChange={(e) => handlePositionChange(index, e)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Gesamt (€):
                        </label>
                        <input
                          type="text"
                          value={position.total.toFixed(2)}
                          readOnly
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-200 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {data.positions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePosition(position.id)}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Position entfernen
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPosition}
                className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
              >
                Position hinzufügen
              </button>

              {/* Summenübersicht */}
              <div className="mt-8 pt-6 border-t border-gray-300 text-right">
                <p className="text-lg mb-2">
                  Netto:{" "}
                  <strong className="text-xl">{subtotal.toFixed(2)} €</strong>
                </p>{" "}
                {/* Dummy-Werte */}
                <p className="text-lg mb-2">
                  MwSt. (0%):{" "}
                  <strong className="text-xl">{taxAmount.toFixed(2)} €</strong>
                </p>{" "}
                {/* Dummy-Werte */}
                <h3 className="text-2xl font-bold text-blue-700 mt-4">
                  Gesamtbetrag: <strong>{grandTotal.toFixed(2)} €</strong>
                </h3>{" "}
                {/* Dummy-Werte */}
              </div>
            </section>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-bold text-xl rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 mt-8 cursor-pointer"
            >
              Rechnung generieren
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

export default App;
