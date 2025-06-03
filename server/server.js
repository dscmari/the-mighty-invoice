import express from 'express';
import pg from 'pg';
import cors from 'cors'

const app = express();

const port = process.env.PORT || 3000;

// Use CORS middleware BEFORE your routes
// This allows requests from ALL origins during development.
// In production, you'd configure it to allow only your frontend's domain.
app.use(cors());

app.use(express.json());

app.post('/api/customers', (req, res) => {
    // This function runs when a POST request hits http://localhost:3001/api/customers
    const customerData = req.body;
    console.log('Received customer:', customerData);
    // ... save to database ...
    res.status(201).json({ message: 'Customer added!' });
});

const pool = new pg.Pool({
  user: 'marian',         // Dein PostgreSQL-Benutzername
  host: 'localhost',      // Dein Datenbank-Host
  database: 'mightyinvoicedb', // Der Name deiner Datenbank
  password: '',           // Leer lassen, wenn marian kein Passwort hat.
                          // Wenn mighty_invoice_app_user, dann hier das Passwort eintragen!
  port: 5432,             // Standard-PostgreSQL-Port
});

// --- Datenbank-Verbindung testen (optional) ---
pool.on('connect', () => {
  console.log('Mit der PostgreSQL-Datenbank verbunden!');
});

pool.on('error', (err) => {
  console.error('Unerwarteter Fehler im idle-Client des DB-Pools', err);
  process.exit(-1); // Beendet die Anwendung bei schwerwiegendem DB-Fehler
});

// Route zum Hinzufügen eines Dummy-Kunden
app.get('/add-dummy-customer', async (req, res) => {
  const dummyCustomer = {
    name: "test_name",
    email: `test.${Date.now()}@example.com`, // Einzigartige E-Mail
    address: '123 Test Street, Anytown',
  };

  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, address)
       VALUES ($1, $2, $3) RETURNING customer_id`,
      [
        dummyCustomer.name,
        dummyCustomer.email,
        dummyCustomer.address,
      ]
    );

    const newCustomerId = result.rows[0].customer_id;
    console.log(`Dummy-Kunde mit ID ${newCustomerId} erfolgreich hinzugefügt.`);
    res.status(201).json({ message: 'Dummy-Kunde hinzugefügt', customerId: newCustomerId });

  } catch (err) {
    console.error('Fehler beim Einfügen des Dummy-Kunden:', err.message);
    res.status(500).json({ error: 'Fehler beim Einfügen des Dummy-Kunden', details: err.message });
  }

});

// Starte den Server
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
  console.log(`Du kannst ihn im Browser öffnen: http://localhost:${port}`);
  console.log(`Um einen Dummy-Kunden hinzuzufügen, besuche: http://localhost:${port}/add-dummy-customer`);
});